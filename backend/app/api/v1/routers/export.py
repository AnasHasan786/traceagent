from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from beanie import PydanticObjectId
from app.models.incident import ErrorLog
from app.models.user import User
from app.core.deps import get_current_user
from app.services.export_service import generate_pdf, generate_markdown

router = APIRouter(prefix="/incidents", tags=["Export"])


@router.get("/{incident_id}/export")
async def export_incident(
    incident_id:  str,
    format:       str  = Query(default="pdf", regex="^(pdf|markdown)$"),
    current_user: User = Depends(get_current_user),
):
    # ── Validate ID ────────────────────────────────────────────────────────
    try:
        obj_id = PydanticObjectId(incident_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid incident ID format.")

    # ── Fetch & authorise ──────────────────────────────────────────────────
    log = await ErrorLog.get(obj_id)
    if not log:
        raise HTTPException(status_code=404, detail="Incident not found.")

    workspace_id = f"workspace-{str(current_user.id)[:8]}"
    if log.workspace_id != workspace_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # ── Sanitise filename ──────────────────────────────────────────────────
    safe_name = (
        log.service_name
        .lower()
        .replace(" ", "-")
        .replace("/", "-")
        [:60]
    )

    # ── Generate & return ──────────────────────────────────────────────────
    if format == "pdf":
        try:
            pdf_bytes = generate_pdf(log)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"PDF generation failed: {e}",
            )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}-report.pdf"',
                "Cache-Control": "no-store",
            },
        )

    # format == "markdown"
    try:
        md_bytes = generate_markdown(log)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Markdown generation failed: {e}",
        )
    return Response(
        content=md_bytes,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}-report.md"',
            "Cache-Control": "no-store",
        },
    )