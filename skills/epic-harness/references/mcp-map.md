# 两个网站与内部 MCP 的对应关系

公开网站没有 MCP 端点。下表是 epic-intel 部署内部的 MCP 工具。本技能只使用右侧已经公开的只读 HTTP 接口。

| 内部 MCP | 工具 | 公开技能是否调用 | 对应公开接口 |
| --- | --- | --- | --- |
| surveillance | `get_case_timeseries`、`get_incidence_by_region`、`get_lab_positivity`、`get_reporting_delay` | 不直接调用。这些工具只在可信区返回聚合统计 | EpicIntel `/api/disease-overview`、`/api/dashboard/summary`、`/api/datasources` |
| spatial | `get_region_boundaries`、`get_cases_heatmap`、`detect_hotspots`、`get_vector_density_map` | 不直接调用。禁止个案坐标 | EpicDemic `/api/data/map/` 只使用站点已经公开的事件坐标；EpicIntel `/api/risk-map` |
| epimodel | `estimate_rt`、`nowcast_cases`、`forecast_incidence`、`run_seir_scenario`、`compare_interventions` | 不调用。模型数字必须由确定性程序产生，不能由对话临时估算 | 无公开写入口。不要在回答里现算 Rt 或 SEIR |
| evidence | `search_official_notices`、`search_news`、`search_literature`、`search_guidelines`、`register_evidence` | 不调用写入。检索结果以两个站点已经返回的来源字段为准 | EpicDemic 记录里的来源机构；EpicIntel `/api/datasources` |
| report | `validate_report_json`、`write_report_package`、`render_html`、`render_pdf`、`attach_figure` | 不调用写入和渲染 | EpicIntel `GET /api/reports` |
| approval | `submit_for_review`、`record_decision`、`publish_report`、`get_audit_trail` | 全部不调用。审批和发布只属于人工界面 | 无 |
| alert | 应急外发 | 不调用 | 无 |

内部 MCP 的硬边界在这里同样有效：

- 不输出病例行级字段。
- 不把事件记录说成临床病例。
- 机器结果停在可供人工复核的材料，不写成已批准或已发布。
- 流行病学模型数字不能在对话里口算后当作运行结果。
