const { exec } = require("child_process");
const fs = require("fs");

exec("npx tsc --noEmit", (err, stdout, stderr) => {
  const output = stdout || stderr;

  fs.writeFileSync("TYPESCRIPT_ERRORS_REPORT.txt", output);

  console.log("✓ تم استخراج تقرير الأخطاء بالكامل:");
  console.log("-> TYPESCRIPT_ERRORS_REPORT.txt");
});
