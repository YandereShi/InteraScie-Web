const chartColors = ["00BF63", "1289F0", "F5AD42"];
const chartNamespace = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const drawingNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
const relationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function Escape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}

function RichText(text) {
  return `<c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1100"><a:latin typeface="Calibri"/></a:rPr><a:t>${Escape(text)}</a:t></a:r></a:p></c:rich></c:tx>`;
}

function ChartXML(chart) {
  const sheet = `'${chart.sheetName.replaceAll("'", "''")}'!`;
  const categories = Array.from({ length: 16 }, (_, index) => `<c:pt idx="${index}"><c:v>${index}</c:v></c:pt>`).join("");
  const series = chart.series.map((item, index) => {
    const points = item.counts.map((count, score) => `<c:pt idx="${score}"><c:v>${count}</c:v></c:pt>`).join("");
    return `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:v>${Escape(item.name)}</c:v></c:tx>
      <c:spPr><a:solidFill><a:srgbClr val="${chartColors[index]}"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>
      <c:cat><c:strRef><c:f>${Escape(sheet + chart.categories)}</c:f><c:strCache><c:ptCount val="16"/>${categories}</c:strCache></c:strRef></c:cat>
      <c:val><c:numRef><c:f>${Escape(sheet + item.range)}</c:f><c:numCache><c:formatCode>0</c:formatCode><c:ptCount val="16"/>${points}</c:numCache></c:numRef></c:val></c:ser>`;
  }).join("");
  const majorUnit = Math.max(1, Math.ceil(Math.max(...chart.series.flatMap((item) => item.counts)) / 5));
  return `${declaration}<c:chartSpace xmlns:c="${chartNamespace}" xmlns:a="${drawingNamespace}">
    <c:lang val="en-US"/><c:chart><c:title>${RichText(`${chart.branch} — Score distribution`)}<c:overlay val="0"/></c:title>
    <c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}
    <c:gapWidth val="80"/><c:overlap val="0"/><c:axId val="100"/><c:axId val="200"/></c:barChart>
    <c:catAx><c:axId val="100"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>
    <c:title>${RichText("Scores (out of 15)")}<c:overlay val="0"/></c:title><c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/>
    <c:tickLblPos val="nextTo"/><c:crossAx val="200"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:tickLblSkip val="1"/><c:tickMarkSkip val="1"/></c:catAx>
    <c:valAx><c:axId val="200"/><c:scaling><c:orientation val="minMax"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/>
    <c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E2E8E5"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>
    <c:title>${RichText("Number of students")}<c:overlay val="0"/></c:title><c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/>
    <c:tickLblPos val="nextTo"/><c:crossAx val="100"/><c:crosses val="autoZero"/><c:crossBetween val="between"/><c:majorUnit val="${majorUnit}"/></c:valAx></c:plotArea>
    <c:legend><c:legendPos val="t"/><c:layout/><c:overlay val="0"/></c:legend><c:plotVisOnly val="0"/><c:dispBlanksAs val="gap"/></c:chart>
    <c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>
    <c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1000"><a:solidFill><a:srgbClr val="222222"/></a:solidFill><a:latin typeface="Calibri"/></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr></c:chartSpace>`;
}

function DrawingXML(charts) {
  return `${declaration}<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="${drawingNamespace}" xmlns:c="${chartNamespace}" xmlns:r="${relationshipNamespace}">${charts.map((chart, index) => `
    <xdr:twoCellAnchor><xdr:from><xdr:col>22</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.row - 1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>36</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.row + 14}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${index + 1}" name="${Escape(chart.branch)} score distribution"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
    <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${chartNamespace}"><c:chart r:id="rId${index + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join("")}</xdr:wsDr>`;
}

export async function AddSectionReportCharts(buffer, charts) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  let contentTypes = await zip.file("[Content_Types].xml").async("string");
  let workbookXML = await zip.file("xl/workbook.xml").async("string");
  const bySheet = new Map();
  charts.forEach((chart) => {
    const group = bySheet.get(chart.sheetID) ?? [];
    group.push(chart);
    bySheet.set(chart.sheetID, group);
  });
  let chartID = 0;
  for (const [sheetID, sheetCharts] of bySheet) {
    const sheetName = sheetCharts[0].sheetName;
    workbookXML = workbookXML.replaceAll(`&apos;${Escape(sheetName)}&apos;!`, () => `&apos;${Escape(sheetName.replaceAll("'", "''"))}&apos;!`);
    const drawingPath = `xl/drawings/scoreDistribution${sheetID}.xml`;
    const sheetPath = `xl/worksheets/sheet${sheetID}.xml`;
    const relsPath = `xl/worksheets/_rels/sheet${sheetID}.xml.rels`;
    const sheetXML = await zip.file(sheetPath).async("string");
    const relsXML = zip.file(relsPath) ? await zip.file(relsPath).async("string") : `${declaration}<Relationships xmlns="${packageNamespace}"></Relationships>`;
    zip.file(sheetPath, sheetXML.replace("</worksheet>", '<drawing r:id="rIdScoreDistribution"/></worksheet>'));
    zip.file(relsPath, relsXML.replace("</Relationships>", `<Relationship Id="rIdScoreDistribution" Type="${relationshipNamespace}/drawing" Target="../drawings/scoreDistribution${sheetID}.xml"/></Relationships>`));
    zip.file(drawingPath, DrawingXML(sheetCharts));
    const chartRelationships = sheetCharts.map((chart, index) => {
      chartID += 1;
      const path = `xl/charts/scoreDistribution${chartID}.xml`;
      zip.file(path, ChartXML(chart));
      contentTypes = contentTypes.replace("</Types>", `<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>`);
      return `<Relationship Id="rId${index + 1}" Type="${relationshipNamespace}/chart" Target="../charts/scoreDistribution${chartID}.xml"/>`;
    }).join("");
    zip.file(`xl/drawings/_rels/scoreDistribution${sheetID}.xml.rels`, `${declaration}<Relationships xmlns="${packageNamespace}">${chartRelationships}</Relationships>`);
    contentTypes = contentTypes.replace("</Types>", `<Override PartName="/${drawingPath}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`);
  }
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("xl/workbook.xml", workbookXML);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
