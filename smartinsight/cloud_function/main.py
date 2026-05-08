import os
import functions_framework
from google.cloud import storage, firestore
from google import genai
from google.genai import types

PROJECT_ID = os.environ["GCP_PROJECT"]
MODEL = "gemini-3.1-flash-lite"

IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@functions_framework.cloud_event
def process_upload(cloud_event):
    data = cloud_event.data
    bucket_name = data["bucket"]
    blob_name = data["name"]

    file_id = blob_name.split("/")[0]

    db = firestore.Client()
    ref = db.collection("insights").document(file_id)
    ref.update({"status": "processing"})

    try:
        storage_client = storage.Client()
        blob = storage_client.bucket(bucket_name).blob(blob_name)
        file_bytes = blob.download_as_bytes()
        content_type = blob.content_type or "application/octet-stream"

        client = genai.Client(vertexai=True, project=PROJECT_ID, location="global")

        if content_type in IMAGE_TYPES:
            prompt = (
                "Analyze this image thoroughly. Describe what you see: objects, "
                "people, text, colors, setting, and any notable details. "
                "Then provide a concise one-sentence summary."
            )
        elif content_type == "application/pdf":
            prompt = (
                "Summarize this PDF document. Extract the main topic, key points, "
                "and any important conclusions. Format with a short summary paragraph "
                "followed by bullet-point key takeaways."
            )
        else:
            prompt = (
                "Summarize this text document. Identify the main topic, key points, "
                "and any action items or conclusions."
            )

        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=content_type),
                prompt,
            ],
        )

        ref.update({
            "status": "complete",
            "analysis": response.text,
            "model": MODEL,
            "completed_at": firestore.SERVER_TIMESTAMP,
        })

    except Exception as exc:
        ref.update({"status": "error", "error": str(exc)})
        raise
