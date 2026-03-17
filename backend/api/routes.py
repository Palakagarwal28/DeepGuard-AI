from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from services.image_service import predict_image
from services.video_service import predict_video
from services.audio_service import predict_audio
from utils.pdf_generator import generate_pdf_report

router = APIRouter()

class ExplanationSchema(BaseModel):
    summary: str
    key_indicators: List[str] = []
    modality_specific: Optional[Dict[str, str]] = None

class ReportRequest(BaseModel):
    filename: str
    file_type: str
    result: str
    confidence: float
    risk_level: str
    explanation: ExplanationSchema
    timestamp: str

@router.post("/detect/image")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    
    content = await file.read()
    result = await predict_image(content)
    return result

@router.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video.")
    
    # Save video locally to process with OpenCV
    # In a real app we might process it as a stream, but OpenCV needs a file
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = await predict_video(tmp_path)
    finally:
        os.remove(tmp_path)
        
    return result

@router.post("/detect/audio")
async def detect_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")
    
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = await predict_audio(tmp_path)
    finally:
        os.remove(tmp_path)

    return result

@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    try:
        # Convert Pydantic model to dict
        report_data = request.dict()
        
        # Generate the PDF
        output_filename = f"report_{request.filename}.pdf"
        filepath = generate_pdf_report(report_data, output_filename=output_filename)
        
        print(f"[DEBUG] Sending FileResponse for {filepath}")
        
        # Return the file as a downloadable response
        return FileResponse(
            path=filepath, 
            filename="report.pdf", 
            media_type='application/pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
