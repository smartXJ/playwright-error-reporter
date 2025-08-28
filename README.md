# Playwright Error Reporter

## 使用
playwright.config.ts下
```ts
	reporter: [
		["html"], // 官方html报告
		['./error-html-reporter.ts'], // 新增报错分类报告
	],
```
执行后会在`playwright-report`目录下生成`playwright-error-report.html`文件，打开即可查看

## 截图
![image](./error-report.png)# playwright-error-reporter
