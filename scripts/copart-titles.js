/**
 * Refreshes src/lib/copart-titles.json, Copart's wording and group for each title state and code.
 * The export carries only the code, and copart.com answers only a real browser, so this runs there:
 *
 * 1. List one active lot per "STATE CODE" pair the file does not hold yet, against the ingest database:
 *      SELECT DISTINCT ON (title_state, title_type) lot_number FROM lots
 *      WHERE removed_at IS NULL AND source = 'copart' AND title_type IS NOT NULL;
 * 2. Open any copart.com page, paste this file into the console with LOTS set to those lot numbers,
 *    and wait for "copied".
 * 3. Merge the clipboard's entries into src/lib/copart-titles.json, keys sorted, and copy the file to
 *    the API (../cars-secrets-api/app/copart_titles.json), whose title filter reads the same groups.
 */
const LOTS = [];

const entries = {};
for (const lot of LOTS) {
  const details = (await (await fetch(`/public/data/lotdetails/solr/${lot}`)).json()).data.lotDetails;
  // ts is the title state, stt the code, td the wording, and tgc the group: "TITLEGROUP_C" (clean),
  // "TITLEGROUP_S" (salvage) or "TITLEGROUP_J" (non-repairable). Some lots' wording ends in " (P)",
  // which copart.com does not show and which differs between lots of the same pair: it is dropped.
  if (details?.ts && details.stt && details.td) {
    entries[`${details.ts} ${details.stt}`] = [details.td.replace(/\s*\(P\)$/, ""), details.tgc?.slice(-1)];
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
}
copy(JSON.stringify(entries, null, 2));
console.log("copied", Object.keys(entries).length);
