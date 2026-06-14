from fastapi import APIRouter, Depends
from app.models.incident import ErrorLog
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.incident import DashboardStatsResponse
from app.schemas.analytics import AnalyticsResponse
from datetime import datetime, timezone, timedelta
from collections import defaultdict

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
):
    workspace_id = f"workspace-{str(current_user.id)[:8]}"

    total     = await ErrorLog.find(ErrorLog.workspace_id == workspace_id).count()
    analyzed  = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "analyzed"
    ).count()
    failed    = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "failed"
    ).count()
    permanent = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id,
        ErrorLog.status == "permanently_failed"
    ).count()
    pending   = await ErrorLog.find(
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


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(get_current_user),
):
    workspace_id = f"workspace-{str(current_user.id)[:8]}"

    logs = await ErrorLog.find(
        ErrorLog.workspace_id == workspace_id
    ).sort(-ErrorLog.timestamp).to_list()

    if not logs:
        return AnalyticsResponse(
            incidents_over_time=[],
            status_breakdown=[],
            top_services=[],
            total=0,
            analyzed=0,
            failed=0,
            pending=0,
            busiest_day=None,
            most_failing_service=None,
        )

    # ── Incidents over time (last 14 days) ────────────────────────────────
    now   = datetime.now(timezone.utc)
    today = now.date()
    day_counts: dict[str, int] = {}
    for i in range(13, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        day_counts[d] = 0

    for log in logs:
        ts = log.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        day = ts.date().isoformat()
        if day in day_counts:
            day_counts[day] += 1

    incidents_over_time = [
        {"date": d, "count": c} for d, c in day_counts.items()
    ]

    # ── Status breakdown ──────────────────────────────────────────────────
    status_counts: dict[str, int] = defaultdict(int)
    for log in logs:
        status_counts[log.status] += 1

    STATUS_LABELS = {
        "analyzed":            "Analyzed",
        "pending":             "Pending",
        "failed":              "Failed",
        "permanently_failed":  "Dead Letter",
        "quota_exceeded":      "Quota Exceeded",
        "configuration_error": "Config Error",
    }
    STATUS_COLORS = {
        "analyzed":            "#10b981",
        "pending":             "#6366f1",
        "failed":              "#ef4444",
        "permanently_failed":  "#dc2626",
        "quota_exceeded":      "#f59e0b",
        "configuration_error": "#f59e0b",
    }
    status_breakdown = [
        {
            "status": k,
            "label":  STATUS_LABELS.get(k, k),
            "count":  v,
            "color":  STATUS_COLORS.get(k, "#6b7280"),
        }
        for k, v in sorted(status_counts.items(), key=lambda x: -x[1])
    ]

    # ── Top services by incident count ────────────────────────────────────
    service_counts:   dict[str, int] = defaultdict(int)
    service_failures: dict[str, int] = defaultdict(int)

    for log in logs:
        svc = log.service_name
        service_counts[svc] += 1
        if log.status in ("failed", "permanently_failed"):
            service_failures[svc] += 1

    top_services = [
        {
            "service":  svc,
            "total":    service_counts[svc],
            "failures": service_failures.get(svc, 0),
        }
        for svc in sorted(service_counts, key=lambda s: -service_counts[s])
    ][:8]

    # ── Summary scalars ───────────────────────────────────────────────────
    total    = len(logs)
    analyzed = status_counts.get("analyzed", 0)
    failed   = status_counts.get("failed", 0) + status_counts.get("permanently_failed", 0)
    pending  = status_counts.get("pending", 0)

    busiest_day = max(day_counts, key=lambda d: day_counts[d]) if day_counts else None
    if busiest_day and day_counts[busiest_day] == 0:
        busiest_day = None

    most_failing_service = (
        max(service_failures, key=lambda s: service_failures[s])
        if service_failures else None
    )

    return AnalyticsResponse(
        incidents_over_time=incidents_over_time,
        status_breakdown=status_breakdown,
        top_services=top_services,
        total=total,
        analyzed=analyzed,
        failed=failed,
        pending=pending,
        busiest_day=busiest_day,
        most_failing_service=most_failing_service,
    )