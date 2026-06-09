from fastapi import APIRouter, Depends
from app.models.incident import ErrorLog
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.incident import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
):
    workspace_id = f"workspace-{str(current_user.id)[:8]}"

    total    = await ErrorLog.find(ErrorLog.workspace_id == workspace_id).count()
    analyzed = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "analyzed"
    ).count()
    failed   = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "failed"
    ).count()
    permanent = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "permanently_failed"
    ).count()
    pending  = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "pending"
    ).count()

    total_failed = failed + permanent
    success_rate = round((analyzed / total * 100), 1) if total > 0 else 0.0

    return DashboardStatsResponse(
        total_incidents=total,
        analyzed=analyzed,
        failed=total_failed,
        pending=pending,
        success_rate=success_rate,
    )