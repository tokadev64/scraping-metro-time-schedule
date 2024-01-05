import { ensureDir } from 'https://deno.land/std@0.210.0/fs/ensure_dir.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

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
			const results = [];

			const targets = dom?.getElementsByTagName('tr');
			let tmp = [];
			for (const el of targets) {
				let hour = Number(
					el.querySelector('th').innerText.trim().replace('時', ''),
				);
				if (hour === 0) {
					hour = 24;
				}

				let minutes = el
					.querySelector('td > p')
					.innerText.trim()
					.replace(/※1/g, '') // TODO: `※1` の場合は終着駅が通常と変わるので対応したい
					.split(/ | /);
				minutes = minutes.map(Number);

				if (tmp.find((s) => s.hour === hour)) {
					results.push(tmp);
					tmp = [];
				}
				tmp.push({ hour, minutes });
			}
			results.push(tmp);
			const obj = {};
			const keys = ['downWeekday', 'downHoliday', 'upWeekday', 'upHoliday'];
			keys.forEach((key, i) => {
				if (results[i]) {
					obj[key] = results[i];
				}
			});

			const encoder = new TextEncoder();
			Deno.writeFile(
				`json/${filename}.json`,
				encoder.encode(JSON.stringify(obj)),
			);
		});
});
