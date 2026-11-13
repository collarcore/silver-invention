# LV2026 // Results Tracker

Sledilnik izidov lokalnih volitev 2026 (212 občin). Stran je `index.html`; podatke bere iz `data.json`.

`data.json` samodejno osvežuje opravilo **zajem** (zavihek Actions): prenese izvoze DVK za vse občine in jih pretvori.
Ročni zagon: Actions → zajem → Run workflow.

Vir podatkov: Državna volilna komisija, volitve.dvk-rs.si/lv2026. Neuradni delni izidi; uradni so samo pri DVK.
