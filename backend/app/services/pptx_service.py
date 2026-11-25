import io
import uuid
import zipfile
from fastapi import HTTPException
from pptx import Presentation as PptxPresentation
from app.config import settings


def validate_pptx_archive(raw_bytes: bytes) -> None:
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(raw_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail="Uploaded PPTX exceeds maximum size limit")
    try:
        with zipfile.ZipFile(io.BytesIO(raw_bytes), "r") as zf:
            total_uncompressed = sum(info.file_size for info in zf.infolist())
            if total_uncompressed > max_bytes * 4:
                raise HTTPException(status_code=400, detail="PPTX archive uncompressed size exceeds safety threshold")
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail="Invalid PPTX archive") from exc


def parse_pptx_bytes(raw_bytes: bytes, title: str, owner_id: str, owner_name: str) -> dict:
    validate_pptx_archive(raw_bytes)
    prs = PptxPresentation(io.BytesIO(raw_bytes))
    width_px = int((prs.slide_width / 914400) * 96) if prs.slide_width else 1280
    height_px = int((prs.slide_height / 914400) * 96) if prs.slide_height else 720
    slides = []
    warnings = []

    for idx, slide in enumerate(prs.slides):
        slide_id = f"slide-{uuid.uuid4().hex[:8]}"
        objects = []
        for sp_idx, shape in enumerate(slide.shapes):
            x = int((shape.left / 914400) * 96) if shape.left else 60
            y = int((shape.top / 914400) * 96) if shape.top else 60
            w = max(60, int((shape.width / 914400) * 96)) if shape.width else 400
            h = max(40, int((shape.height / 914400) * 96)) if shape.height else 100

            if shape.has_text_frame:
                text = "\n".join(p.text for p in shape.text_frame.paragraphs).strip()
                if text:
                    objects.append({
                        "id": f"obj-{uuid.uuid4().hex[:8]}",
                        "slideId": slide_id,
                        "type": "text",
                        "name": shape.name or f"Text {sp_idx + 1}",
                        "x": x,
                        "y": y,
                        "width": w,
                        "height": h,
                        "rotation": 0,
                        "zIndex": sp_idx + 1,
                        "locked": False,
                        "visible": True,
                        "opacity": 1,
                        "flipX": False,
                        "flipY": False,
                        "textData": {
                            "text": text,
                            "padding": 12,
                            "style": {
                                "fontFamily": "Segoe UI",
                                "fontSize": 20,
                                "fontWeight": "normal",
                                "fontStyle": "normal",
                                "textDecoration": "none",
                                "color": "#242424",
                                "letterSpacing": 0,
                                "lineHeight": 1.35,
                                "textAlign": "left",
                                "verticalAlign": "top",
                                "listType": "none",
                                "indentLevel": 0,
                                "direction": "ltr",
                            },
                        },
                    })
            elif shape.shape_type == 13:  # PICTURE
                warnings.append(f"Slide {idx + 1}: Picture '{shape.name}' requires media upload endpoint.")

        notes_text = ""
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes_text = slide.notes_slide.notes_text_frame.text

        slides.append({
            "id": slide_id,
            "order": idx,
            "title": f"Slide {idx + 1}",
            "layout": "custom",
            "hidden": False,
            "background": {"type": "solid", "color": "#FFFFFF"},
            "notes": notes_text,
            "transition": {
                "effect": "none",
                "duration": 500,
                "direction": "left",
                "advanceOnClick": True,
                "autoAdvanceAfter": None,
            },
            "objects": objects,
            "animations": [],
        })

    return {
        "presentation": {
            "id": f"pres-{uuid.uuid4().hex[:8]}",
            "title": title,
            "ownerId": owner_id,
            "ownerName": owner_name,
            "width": width_px,
            "height": height_px,
            "themeId": "corporate",
            "slides": slides,
        },
        "warnings": warnings,
    }

