import { ensureDir } from 'https://deno.land/std@0.210.0/fs/ensure_dir.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

type Schedule = {
	hour: string;
	minutes: string[];
};

const filenames = [
	...[...Array(16)].map((_, i: number) => (i + 1).toString().padStart(3, 'n0')),
	...[...Array(19)].map((_, i: number) => (i + 1).toString().padStart(3, 't0')),
	...[...Array(14)].map((_, i: number) => (i + 1).toString().padStart(3, 'h0')),
];

ensureDir('./json');
filenames.map((filename: string) => {
	fetch(`https://www.city.sapporo.jp/st/subway/route_time/h26/${filename}.html`)
		.then((response) => response.text())
		.then((source) => {
			const dom = new DOMParser().parseFromString(source, 'text/html');
			const resultsWeekday = <Schedule[]>[];
			const resultsHoliday = <Schedule[]>[];

			const targets = dom?.getElementsByTagName('tr');
			for (const el of targets) {
				const hour = el.querySelector('th').innerText.trim().replace('時', '');
				const minutes = el
					.querySelector('td > p')
					.innerText.trim()
					.split(/ | /);
				if (resultsWeekday.find((r) => r.hour === hour)) {
					resultsHoliday.push({ hour, minutes });
				} else {
					resultsWeekday.push({ hour, minutes });
				}
			}
			const encoder = new TextEncoder();
			Deno.writeFile(
				`json/${filename}_weekday.json`,
				encoder.encode(JSON.stringify(resultsWeekday)),
			);
			Deno.writeFile(
				`json/${filename}_holiday.json`,
				encoder.encode(JSON.stringify(resultsHoliday)),
			);
		});
});
