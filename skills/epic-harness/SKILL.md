---
name: epic-harness
display_name: Epic 双站情报
display_name_en: Epic Harness
description: Query live EpicDemic and EpicIntel public monitoring data under EpicIntel Harness fail-closed rules. Use when the user asks about outbreak signals, epidemic events, disease overviews, risk maps, public-health reports, EpicDemic, EpicIntel, or the epic-intel harness.
description_zh: 只读查询 epicdemic.hylouis.top 与 epicintel.hylouis.top 的公开监测数据，并按 EpicIntel Harness 的停机和人工复核规则回答。
description_en: Read-only queries against the EpicDemic and EpicIntel public sites, with EpicIntel Harness fail-closed rules.
category: data-analysis
version: 1.0.0
author: Hylouis233
allowed-tools: Bash,Read
---

# Epic Harness

用这个技能回答两个公开网站上的传染病监测问题：

- EpicDemic：https://epicdemic.hylouis.top/
- EpicIntel：https://epicintel.hylouis.top/

两个网站当前没有单独的 `/mcp` 地址。站内智能体使用的 MCP 工具在部署内部，不对外挂载。这个技能通过 `scripts/query.py` 连接它们已经公开的只读 HTTP 接口，并遵守内部 MCP 的权限边界。工具名和禁止事项见 `references/mcp-map.md`。

这是监测和工程技能，不是诊断，不估计个体风险，不替代公共卫生专业人员。

## 先选站点

- 要看公众疫情事件列表、地图、概览、EpiETL 快照：用 EpicDemic。
- 要看病种目录、数据源覆盖、病种汇总、风险地图、已公开报告列表、服务健康状态：用 EpicIntel。
- 用户同时问两边时，两边都查，并写明每条数字来自哪个站点。

本地的 `epic-intel-harness` 仓库是合成数据上的评测工具，不读取这两个网站，也不能代替这里的实时查询。

## 查询

在本技能目录执行。默认只打印截断后的 JSON。需要完整载荷时加 `--raw`。

```bash
python scripts/query.py demic-overview
python scripts/query.py demic-table --disease 登革热 --page 1 --page-size 5
python scripts/query.py demic-map --continent Asia --limit 5
python scripts/query.py demic-epietl --limit 5
python scripts/query.py intel-health
python scripts/query.py intel-summary
python scripts/query.py intel-sources
python scripts/query.py intel-diseases
python scripts/query.py intel-diseases --slug dengue-fever
python scripts/query.py intel-risk --disease 登革热 --limit 5
python scripts/query.py intel-reports --limit 5
python scripts/query.py intel-catalog
```

EpicDemic 过滤参数：`--keyword`、`--disease`、`--continent`、`--date-from`、`--date-to`。日期用 `YYYY-MM-DD`。

EpicIntel 报告还可加 `--status`、`--risk-level`、`--region`、`--report-kind`、`--slug`。

## 回答规则

1. 先说明查询时间和接口是否成功。EpicIntel 的 `/api/health` 若不是 `ok`，或 `database` 不可用，先写这个状态，再给其余结果。
2. 空值和零分开。没有解析到病例数，不等于零例。
3. 事件条数、病例数、死亡数不要混成一个总数。EpicDemic 的事件记录和 EpicIntel 的病例监测不是同一口径。
4. 保留病种名、地点、日期、来源机构。EpicDemic 事件给页面上的记录标识；EpicIntel 报告给 `report_id`。
5. 数字只来自刚才的命令输出。接口失败时说明失败，不改用记忆中的疫情数字。
6. 不调用管理员、登录、审批、发布、告警外发、模板上传或任何写入接口。
7. 不把结果写成临床建议或官方预警。结尾写明这是公开来源监测，不是诊断。

## 默认输出

先写数据状态，再给一张短表：

`日期 | 病种 | 地点 | 数量口径 | 来源 | 站点`

表后写使用的过滤条件、截断前的总数，以及未覆盖的缺口。
