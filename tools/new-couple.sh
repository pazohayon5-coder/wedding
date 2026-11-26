#!/bin/bash
# יוצר עותק נפרד של האפליקציה לזוג חדש, בלי לגעת באפליקציה של אורי ויובל.
# שימוש:  tools/new-couple.sh <slug> <שם1> <שם2> [כתובת exec של Apps Script]
# דוגמה:  tools/new-couple.sh alon-liat אלון ליאת
# התוצאה: תיקייה <slug>/ עם index.html + rsvp.html (כתובת: .../wedding/<slug>/)
#          וקובץ backend/Code-<slug>.gs להדבקה בגיליון Google חדש של הזוג.
# להסתרת לשונית ימי שישי:  HIDE_DATES=1 tools/new-couple.sh ...
# אפשר להריץ שוב בכל פעם שהאפליקציה הראשית מתעדכנת (או כשמתקבלת כתובת exec).
set -e
cd "$(dirname "$0")/.."
SLUG="$1"; N1="$2"; N2="$3"; API="${4:-}"
[[ "$SLUG" =~ ^[a-z0-9-]+$ && -n "$N1" && -n "$N2" ]] || { echo "usage: $0 slug name1 name2 [api]"; exit 1; }
# אם לא ניתנה כתובת, שומרים את זו שכבר קיימת אצל הזוג (אם יש)
if [ -z "$API" ] && [ -f "$SLUG/index.html" ]; then
  API=$(grep -o "window.WEDDING_API='[^']*'" "$SLUG/index.html" | head -1 | sed "s/window.WEDDING_API='//;s/'$//")
fi
mkdir -p "$SLUG"
ORIG_API="window.WEDDING_API='[^']*'"
for f in index.html rsvp.html; do
  sed -e "s#$ORIG_API#window.WEDDING_API='$API'#" \
      -e "s/wedding-ori-yuval-v1/wedding-$SLUG-v1/g" \
      -e "s/אורי/$N1/g" -e "s/יובל/$N2/g" \
      -e 's#<meta charset="utf-8">#<meta charset="utf-8"><meta name="robots" content="noindex">#' \
      "$f" > "$SLUG/$f"
done
sed -e "s/אורי/$N1/g" -e "s/יובל/$N2/g" backend/Code.gs > "backend/Code-$SLUG.gs"
if [ -n "$HIDE_DATES" ]; then
  sed -i "s/,\['dates','תאריכים ימי שישי'\]//" "$SLUG/index.html"
  grep -q "'dates','תאריכים" "$SLUG/index.html" && { echo "failed to hide dates tab"; exit 1; }
fi
echo "built $SLUG/ (api: ${API:-none, local mode})"
