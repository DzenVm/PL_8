#!/usr/bin/env bash
#
# bulk-delete-github-repos.sh
# Масове видалення репозиторіїв на GitHub через curl (не потребує gh CLI).
#
# ПОПЕРЕДЖЕННЯ: видалення репозиторію на GitHub НЕЗВОРОТНЄ.
#
# ЯК КОРИСТУВАТИСЯ:
#   1. Створіть Personal Access Token на GitHub:
#      Settings → Developer settings → Personal access tokens → Tokens (classic)
#      Поставте галочку "delete_repo" → Generate token
#   2. Запустіть:  bash bulk-delete-github-repos.sh
#   3. Введіть токен коли запитає
#   4. Спочатку буде DRY RUN — лише список без видалення
#   5. Якщо список правильний — запустіть знову і введіть DELETE

set -euo pipefail

# ============ НАЛАШТУВАННЯ ============

USERNAME="DzenVm"
DRY_RUN=true   # змініть на false щоб видаляти насправді

KEEP=(
  "Skills-Claude"
  "newT_PL04"
  "newT_PL03"
  "newT_PL02"
  "newT_PL01"
  "newT_PL00"
  "denmark-social"
  "dk1-onln"
  "romania-social"
  "pt1-onln"
  "portugal-social"
  "PL_10"
  "PL_9"
  "PL_8"
)

# ========================================

read -rsp "Введіть GitHub Personal Access Token: " TOKEN
echo ""

fetch_repos() {
  local page=1
  while true; do
    local result
    result=$(curl -s \
      -H "Authorization: token $TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/user/repos?per_page=100&page=$page&type=owner")

    local count
    count=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo 0)

    if [ "$count" -eq 0 ]; then break; fi

    echo "$result" | python3 -c "import json,sys; [print(r['name']) for r in json.load(sys.stdin)]"
    ((page++))
  done
}

echo "Отримую список репозиторіїв..."
mapfile -t all_repos < <(fetch_repos)

if [ "${#all_repos[@]}" -eq 0 ]; then
  echo "Не знайдено репозиторіїв. Перевірте токен."
  exit 1
fi

to_delete=()
for repo in "${all_repos[@]}"; do
  keep=false
  for k in "${KEEP[@]}"; do
    [[ "$repo" == "$k" ]] && keep=true && break
  done
  [ "$keep" = false ] && to_delete+=("$repo")
done

echo ""
echo "Всього репозиторіїв: ${#all_repos[@]}"
echo "Захищено (не чіпаємо): ${#KEEP[@]}"
echo "Буде видалено: ${#to_delete[@]}"
echo ""

if [ "${#to_delete[@]}" -eq 0 ]; then
  echo "Немає що видаляти."
  exit 0
fi

echo "Список для видалення:"
printf '  - %s\n' "${to_delete[@]}"

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "DRY RUN — нічого не видалено."
  echo "Відкрийте скрипт, змініть DRY_RUN=true на DRY_RUN=false і запустіть знову."
  exit 0
fi

echo ""
read -rp "Введіть 'DELETE' для підтвердження НЕЗВОРОТНОГО видалення ${#to_delete[@]} репозиторіїв: " confirm
if [ "$confirm" != "DELETE" ]; then
  echo "Скасовано."
  exit 1
fi

for repo in "${to_delete[@]}"; do
  echo -n "Видаляю $repo ... "
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X DELETE \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$USERNAME/$repo")

  if [ "$response" = "204" ]; then
    echo "OK"
  else
    echo "ПОМИЛКА (HTTP $response)"
  fi
  sleep 0.5
done

echo ""
echo "Готово."
