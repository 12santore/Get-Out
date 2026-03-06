/**
 * Google Apps Script Web App receiver for CSV -> Google Sheets sync.
 * Deploy this script as a web app:
 * - Execute as: Me
 * - Who has access: Anyone with the link
 *
 * Set script properties:
 * - SYNC_SECRET: shared secret used by local sync script
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || "{}");
    var secret = payload.secret || "";
    var expectedSecret = PropertiesService.getScriptProperties().getProperty("SYNC_SECRET") || "";

    if (!expectedSecret || secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    var spreadsheetId = payload.spreadsheetId;
    if (!spreadsheetId) {
      return jsonResponse({ ok: false, error: "spreadsheetId is required" }, 400);
    }

    var files = payload.files || [];
    if (!Array.isArray(files) || files.length === 0) {
      return jsonResponse({ ok: false, error: "files[] is required" }, 400);
    }

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var updatedSheets = [];

    files.forEach(function(file) {
      var sheetName = sanitizeSheetName(file.sheetName || "Sheet");
      var csv = String(file.csv || "");
      var rows = Utilities.parseCsv(csv);

      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
      } else {
        sheet.clearContents();
      }

      if (rows.length > 0 && rows[0].length > 0) {
        sheet
          .getRange(1, 1, rows.length, rows[0].length)
          .setValues(rows);
      }
      updatedSheets.push(sheetName);
    });

    return jsonResponse({
      ok: true,
      spreadsheetId: spreadsheetId,
      updatedSheets: updatedSheets
    }, 200);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) }, 500);
  }
}

function sanitizeSheetName(name) {
  var cleaned = String(name).replace(/[\\\/\?\*\[\]\:]/g, " ").trim();
  if (!cleaned) cleaned = "Sheet";
  return cleaned.slice(0, 99);
}

function jsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
