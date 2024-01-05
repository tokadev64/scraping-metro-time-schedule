import { ensureDir } from 'https://deno.land/std@0.210.0/fs/ensure_dir.ts';
import { download } from 'https://deno.land/x/download/mod.ts';

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as pdfjsLib from 'pdfjs-dist';

const filenames = [...Array(24)].map((_, i: number) =>
	(i + 1).toString().padStart(4, 'sc0'),
);
const dir = './pdf';
ensureDir(dir);

const downloadPDF = async (filename, pdfname, url) => {
	await download(url, { file: pdfname, dir });
};

const extractTextFromPDF = async (filename, pdfname): Promise<string> => {
	const pdfPath = `${dir}/${pdfname}`;
	const pdfData = new Uint8Array(fs.readFileSync(pdfPath));

	const loadingTask = pdfjsLib.getDocument({ data: pdfData });
	const pdf = await loadingTask.promise;
	const maxPages = pdf.numPages;
	let pdfText = '';

	for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
		const page = await pdf.getPage(pageNumber);
		const content = await page.getTextContent({
			disableCombineTextItems: true,
			includeMarkedContent: false,
		});
		const pageText = content.items.map((item) =>
			'str' in item ? item.str : '',
		);
		pdfText += pageText;
	}
	pdfText = pdfText.substring(0, pdfText.indexOf(',,停'));
	pdfText = pdfText
		.replace(
			'札幌市電 時刻表, ,Time Table of Sapporo Streetcar, ,2023年11月16日改正（冬ダイヤ）,,',
			'',
		)
		.replace(/,図書館/g, '');
	const minutesList = pdfText.split(',').filter(Number).map(Number);

	const times = <Array<number[]>>[];
	let minutes = <number[]>[];
	let prevMinute = <number>0;
	minutesList.map((min: number) => {
		if (prevMinute >= min) {
			times.push(minutes);
			minutes = [];
		}
		minutes.push(min);
		prevMinute = min;
	});
	minutes = [];
	minutes.push(prevMinute);
	times.push(minutes);

	const timeSchedules = [[], [], [], []];
	const hours = [...Array(19)].map((_, i: number) => i + 6);
	times.map((t, i) => {
		const hour_key = Math.trunc(i / 4);
		const schedule_key = i % 4;
		timeSchedules[schedule_key].push({ hour: hours[hour_key], minutes: t });
	});

	const encoder = new TextEncoder();
	Deno.writeFile(
		`json/${filename}_weekday.json`,
		encoder.encode(JSON.stringify(timeSchedules[0].concat(timeSchedules[1]))),
	);
	Deno.writeFile(
		`json/${filename}_holiday.json`,
		encoder.encode(JSON.stringify(timeSchedules[2].concat(timeSchedules[3]))),
	);
	return JSON.stringify(timeSchedules);
};

filenames.map((filename) => {
	const pdfUrl = `https://www.stsp.or.jp/wp-content/themes/stsp/images/time/time_${filename}.pdf`;

	downloadPDF(filename, path.basename(pdfUrl), pdfUrl).then(() => {
		extractTextFromPDF(filename, path.basename(pdfUrl)).catch((error) => {
			console.error(error);
		});
	});
});
