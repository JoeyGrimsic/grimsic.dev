import os
import uuid
import datetime
import google.auth
import google.auth.transport.requests
from google.auth.iam import Signer
from google.oauth2.service_account import Credentials as SACredentials
from flask import Flask, render_template, jsonify, request, make_response
from google.cloud import storage, firestore

ALLOWED_ORIGINS = {
    "https://grimsic.dev",
    "https://www.grimsic.dev",
    "https://smartinsight-982961624122.us-central1.run.app",
}


def cors(response, origin):
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

SERVICE_ACCOUNT_EMAIL = "982961624122-compute@developer.gserviceaccount.com"


def _signing_credentials():
    """Build IAM-backed signing credentials using the signBlob API."""
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    req = google.auth.transport.requests.Request()
    creds.refresh(req)
    signer = Signer(req, creds, SERVICE_ACCOUNT_EMAIL)
    return SACredentials(
        signer=signer,
        service_account_email=SERVICE_ACCOUNT_EMAIL,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/devstorage.read_write"],
    )

app = Flask(__name__)

GCS_BUCKET = os.environ["GCS_BUCKET"]
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain",
}
MAX_BYTES = 20 * 1024 * 1024  # 20 MB


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload-url", methods=["POST", "OPTIONS"])
def upload_url():
    origin = request.headers.get("Origin", "")
    if request.method == "OPTIONS":
        return cors(make_response(), origin), 204

    data = request.get_json(silent=True) or {}
    filename = data.get("filename", "upload")
    content_type = data.get("content_type", "application/octet-stream")

    if content_type not in ALLOWED_MIME_TYPES:
        return cors(make_response(jsonify({"error": "Unsupported file type"}), 400), origin)

    file_id = str(uuid.uuid4())
    blob_name = f"{file_id}/{filename}"

    signing_creds = _signing_credentials()
    client = storage.Client()
    blob = client.bucket(GCS_BUCKET).blob(blob_name)

    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
        credentials=signing_creds,
    )

    db = firestore.Client()
    db.collection("insights").document(file_id).set({
        "file_name": filename,
        "blob_name": blob_name,
        "content_type": content_type,
        "status": "pending",
        "created_at": firestore.SERVER_TIMESTAMP,
    })

    return cors(make_response(jsonify({"upload_url": signed_url, "file_id": file_id})), origin)


@app.route("/results/<file_id>", methods=["GET", "OPTIONS"])
def results(file_id):
    origin = request.headers.get("Origin", "")
    if request.method == "OPTIONS":
        return cors(make_response(), origin), 204

    if not file_id.replace("-", "").isalnum():
        return cors(make_response(jsonify({"error": "Invalid file ID"}), 400), origin)

    db = firestore.Client()
    doc = db.collection("insights").document(file_id).get()

    if not doc.exists:
        return cors(make_response(jsonify({"status": "not_found"}), 404), origin)

    return cors(make_response(jsonify(doc.to_dict())), origin)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=False)
