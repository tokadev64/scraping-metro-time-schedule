# scraping-metro-time-schedule

## scraping_metro.ts

『札幌市交通局 札幌市営地下鉄』各線の時刻表をスクレイピングし json 形式で保存するスクリプト

```
deno run --allow-net --allow-read --allow-write scraping_metro.ts
```

## scraping_streetcar.ts

『札幌市交通事業振興公社 路面電車』の時刻表をスクレイピングし json 形式で保存するスクリプト

```
pnpm i
deno run --allow-net --allow-read --allow-write scraping_streetcar.ts
```
