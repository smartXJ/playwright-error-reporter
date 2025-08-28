import {
	Reporter,
	TestCase,
	TestResult,
	FullResult,
	FullConfig,
	Suite,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

interface IResult {
	id: string;
	title: string;
	file: string;
	line: number;
	errorMessage: string;
	duration: number;
	projectName: string;
	tags: string[];
	retry: number;
	status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
}
interface ITab {
	key: string;
	label: string;
	count: number;
}
interface IDetails {
	key: string;
	reportMap: Record<string, IResult[]>;
	emptyText: string;
}
interface ColorOptions {
	color: string;
	bg: string;
}
type ColorMap = Record<string, ColorOptions>;
const cssStyle = `
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }

          .header {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: white;
            padding: 24px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }

          .header a {
            background-color: rgba(255, 255, 255, 0.2);
            color: white !important;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .header a:hover {
            background-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }

          .content {
            padding: 24px 32px;
          }

          .tabs {
            display: flex;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 24px;
          }

          .tab {
            padding: 12px 24px;
            cursor: pointer;
            font-weight: 500;
            color: #6c757d;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
          }

          .tab.active {
            color: #6a11cb;
            border-bottom-color: #6a11cb;
          }

          .tab:hover {
            color: #2575fc;
            background-color: #f8f9fa;
          }

          .tab-content {
            display: none;
          }

          .tab-content.active {
            display: block;
          }

          .error-group {
            margin-bottom: 24px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
          }

          .error-group:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          details {
            transition: all 0.3s ease;
          }

          summary {
            background: linear-gradient(to right, #f8d7da, #f5c6cb);
            color: #721c24;
            padding: 12px 20px;
            font-weight: 600;
            cursor: pointer;
            list-style: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
          }

          summary:hover {
            background: linear-gradient(to right, #f1b0b7, #ef9a9a);
          }

          summary::-webkit-details-marker {
            display: none;
          }

          summary:after {
            content: "▼";
            font-size: 14px;
            transition: transform 0.3s ease;
          }

          details[open] summary:after {
            transform: rotate(180deg);
          }

          .error-count {
            background-color: rgba(255, 255, 255, 0.3);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: normal;
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          li {
            margin: 12px 16px;
            padding: 5px 16px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #6a11cb;
            transition: all 0.3s ease;
          }

          li:hover {
            background-color: #f0f1f3;
            transform: translateX(4px);
          }

          .meta {
            font-size: 0.9em;
            color: #6c757d;
            font-family: 'Courier New', Courier, monospace;
          }

          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .title-left {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .title-right {
            font-weight: 600;
            color: #495057;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
          }

          .badge {
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 0.85em;
            display: inline-block;
            margin-right: 6px;
            margin-top: 4px;
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }

          .badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          }

          .browser-badge {
            background-color: #e0f2fe;
            color: #0c4a6e;
          }

          .tag-badge {
            background-color: #dcfce7;
            color: #166534;
          }

          .retry-badge {
            background-color: #fff3cd;
            color: #856404;
          }

          a, a:visited, a:hover, a:active {
            text-decoration: none;
            color: #6a11cb;
            font-weight: 600;
            transition: color 0.2s ease;
          }

          a:hover {
            color: #2575fc;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
          }

          .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
          }

          @media (max-width: 768px) {
            .header {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }

            .title-row {
              flex-direction: column;
              align-items: flex-start;
            }

            .title-right {
              align-self: flex-end;
            }

            .container {
              border-radius: 0;
            }
          }
`;
const colorOptions: ColorOptions[] = [
	{ bg: "#e0f2fe", color: "#0c4a6e" },
	{ bg: "#fce7f3", color: "#831843" },
	{ bg: "#dcfce7", color: "#166534" },
	{ bg: "#fef3c7", color: "#78350f" },
	{ bg: "#ede9fe", color: "#4c1d95" },
	{ bg: "#fee2e2", color: "#991b1b" },
	{ bg: "#ecfeff", color: "#164e63" },
];
function stripAnsi(str: string): string {
	return str.replace(/\u001b\[[0-9;]*m/g, "");
}

function toPosix(p: string) {
	return p.split(path.sep).join("/");
}
const formatDuration = (ms: number) => {
	if (ms >= 60000) {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}m${seconds}s`;
	}
	return `${(ms / 1000).toFixed(1)}s`;
};
class ErrorHtmlReporter implements Reporter {
	private rootDir = process.cwd();
	private results: IResult[] = [];
	private resultsByTestId: Map<string, IResult[]> = new Map();

	onBegin(config: FullConfig, _suite: Suite) {
		this.rootDir = config.rootDir ?? process.cwd();
	}

	onTestEnd(test: TestCase, result: TestResult) {
		const projectName = test.parent.project().name;
		const tags = test.tags;
		const testId = test.id;

		let errorMessage = "";
		if (result.status === "failed") {
			const rawMessage =
				result.error?.message?.split("\n")[0] || "Unknown Error";
			errorMessage = stripAnsi(rawMessage);
		}

		const params = {
			id: testId,
			title: test.title,
			file: toPosix(path.relative(this.rootDir, test.location.file)),
			line: test.location.line,
			errorMessage,
			duration: result.duration,
			projectName,
			tags,
			retry: result.retry,
			status: result.status,
		};

		this.results.push(params);

		if (!this.resultsByTestId.has(params.id)) {
			this.resultsByTestId.set(params.id, []);
		}
		this.resultsByTestId.get(params.id)!.push(params);
	}

	private generateTestItemHtml(
		c: IResult,
		browserColors: any,
		tagColors: any
	): string {
		const browserColor = browserColors[c.projectName] || colorOptions[0];
		const tagBadges =
			c.tags.length > 0
				? c.tags
						.map((tag) => {
							const tagColor = tagColors[tag] || colorOptions[0];
							return `<span class="badge tag-badge" style="background-color: ${tagColor.bg}; color: ${tagColor.color}; border: 1px solid ${tagColor.color};">${tag}</span>`;
						})
						.join(" ")
				: "";
		const retryBadge =
			c.retry > 0
				? `<span class="badge retry-badge">第 ${c.retry} 次重试</span>`
				: "";
		const browserBadge = `<span class="badge browser-badge" style="background-color: ${browserColor.bg}; color: ${browserColor.color}">${c.projectName}</span>`;
		const reportLink = `./index.html#?testId=${encodeURIComponent(c.id)}`;

		return `
  <li>
    <div class="title-row">
      <div class="title-left">
        <div>
        <b><a href="${reportLink}" target="_blank">${c.title}</a></b>
        ${browserBadge}
        ${tagBadges}
        ${retryBadge}
        </div>
      </div>
      <div class="title-right">${formatDuration(c.duration)}</div>
    </div>
    <div class="meta">
      ${c.file}:${c.line}
    </div>
  </li>
`;
	}
	private generateTabs(tabs: ITab[]): string {
		const tabsHtml = tabs
			.map(
				(tab, index) =>
					`<button class="tab ${
						index === 0 ? "active" : ""
					}" onclick="showTab('${tab.key}')">${tab.label} (${
						tab.count
					})</button>`
			)
			.join("");
		return `
      <div class="tabs">
        ${tabsHtml}
      </div
    `;
	}
	private renderEmpty = (label: string) => {
		return `<div class="empty-state"> <div class="empty-state-icon">✓</div> <p>${label}</p> </div> `;
	};
	private generateDetailsItem = (
		cases: IResult[],
		browserColors: ColorMap,
		tagColors: ColorMap
	) => {
		const liHtml = cases
			.map((c) => {
				return this.generateTestItemHtml(c, browserColors, tagColors);
			})
			.join("");
		return `<ul>${liHtml}</ul>`;
	};

	private renderDetails = (
		reportMap: Record<string, IResult[]>,
		browserColors: ColorMap,
		tagColors: ColorMap
	) => {
		return Object.entries(reportMap).map(([msg, cases]) => {
			return `
        <details class="error-group" open="">
          <summary>${msg}</summary>
          ${this.generateDetailsItem(cases, browserColors, tagColors)}
        </details>
      `;
		}).join("");
	};
	private renderDetailsList = (
		list: IDetails[],
		browserColors: ColorMap,
		tagColors: ColorMap
	) => {
	const html = list
			.map((item, index) => {
				return `
      <div id="${item.key}" class="tab-content ${index === 0 ? "active" : ""}">
      ${
				Object.keys(item.reportMap).length > 0
					? this.renderDetails(item.reportMap, browserColors, tagColors)
					: this.renderEmpty(item.emptyText)
			}
      </div>
    `;
			})
			.join("");
		return `<div class="tab-content-box">${html}</div>`;
	};

	async onEnd(result: FullResult) {
		// 全部报告都失败的test
		const failedTests = new Map<string, IResult>();
		// 存在通过和失败的test
		const flakyTests = new Map<string, IResult>();

		// 全部错误报告，key为错误信息，value为报告列表
		const grouped: Record<string, IResult[]> = {};
		const failedGrouped: Record<string, IResult[]> = {};
		const flakyGrouped: Record<string, IResult[]> = {};

		for (const r of this.results) {
			if (r.status === "failed") {
				if (!grouped[r.errorMessage]) grouped[r.errorMessage] = [];
				grouped[r.errorMessage].push(r);
			}
		}
		this.resultsByTestId.forEach((value) => {
			const firstTest = value[0];
			const lastTest = value[value.length - 1];
			if (firstTest.status === "failed" && lastTest.status === "passed") {
				flakyTests.set(firstTest.id, firstTest);
			} else if (
				firstTest.status === "failed" &&
				lastTest.status === "failed"
			) {
				failedTests.set(firstTest.id, firstTest);
			}
		});
		for (const test of Array.from(failedTests.values())) {
			if (test.errorMessage && !failedGrouped[test.errorMessage])
				failedGrouped[test.errorMessage] = [];
			if (test.errorMessage) failedGrouped[test.errorMessage].push(test);
		}
		for (const test of Array.from(flakyTests.values())) {
			if (test && test.errorMessage) {
				if (!flakyGrouped[test.errorMessage])
					flakyGrouped[test.errorMessage] = [];
				flakyGrouped[test.errorMessage].push(test);
			}
		}

		const browserColors: ColorMap = {};
		const tagColors: ColorMap = {};

		const browsers = Array.from(
			new Set(this.results.map((r) => r.projectName))
		);
		browsers.forEach((browser, i) => {
			const colorIndex = i % colorOptions.length;
			browserColors[browser] = colorOptions[colorIndex];
		});

		const allTags = Array.from(new Set(this.results.flatMap((r) => r.tags)));
		allTags.forEach((tag, i) => {
			const colorIndex = i % colorOptions.length;
			tagColors[tag] = colorOptions[colorIndex];
		});
		const allTypes = Object.keys(grouped).length;
		const allErrorReports = Object.values(grouped).flat().length;

		const list = [
			{
				key: "all",
				label: "全部失败报告",
				count: allErrorReports,
				reportMap: grouped,
				emptyText: "没有错误报告",
			},
			{
				key: "failed",
				label: "失败测试",
				count: failedTests.size,
				reportMap: failedGrouped,
				emptyText: "没有失败的测试用例",
			},
			{
				key: "flaky",
				label: "不稳定测试",
				count: flakyTests.size,
				reportMap: flakyGrouped,
				emptyText: "没有不稳定的测试用例",
			},
		];

		const html = `
      <html>
        <head>
            <meta charset="utf-8">
            <title>按错误信息分类报告</title>
            <style> ${cssStyle} </style>
        </head>

        <body>
            <div class="container">
                <div class="header">
                    <h1>按报错信息分类 (${allTypes} types | ${allErrorReports} report)</h1>
                    <a href="./index.html" target="_blank">查看完整报告</a>
                </div>
                <div class="content">
                  ${this.generateTabs(list)}
                  ${this.renderDetailsList(list, browserColors, tagColors)}
                </div>
            </div>

            <script>
              function showTab(tabName) {
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });

                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                });

                document.getElementById(tabName).classList.add('active');
                event.target.classList.add('active');
              }
            </script>
        </body>
      </html>
      `;

		const outFile = path.join(
			process.cwd(),
			"./playwright-report/playwright-error-report.html"
		);
		fs.writeFileSync(outFile, html, "utf-8");
		// console.log(`✅ 错误分类报告已生成: ${outFile}`);
	}
}

export default ErrorHtmlReporter;
