#!/usr/bin/env bash
#
# bulk-delete-github-repos.sh
# Масове видалення репозиторіїв на GitHub через GitHub CLI (gh).
#
# ПОПЕРЕДЖЕННЯ: видалення репозиторію на GitHub НЕЗВОРОТНЄ.
# Кошика немає — код, issues, PR, wiki, релізи зникають назавжди.
#
# ПЕРЕД ЗАПУСКОМ:
#   1. Встановіть GitHub CLI: https://cli.github.com
#   2. gh auth login
#   3. gh auth refresh -h github.com -s delete_repo   (дає право на видалення)
#
# ЯК КОРИСТУВАТИСЯ:
#   1. Заповніть налаштування нижче
#   2. Запустіть з DRY_RUN=true — побачите список БЕЗ видалення
#   3. Якщо все правильно — поставте DRY_RUN=false, запустіть знову й підтвердіть

set -euo pipefail

# ============ НАЛАШТУВАННЯ ============

USERNAME="DzenVm"            # ваш логін на GitHub
DRY_RUN=true                 # true = лише показати список, false = видалити насправді

# Режим відбору репозиторіїв: all | keep_list | pattern
MODE="keep_list"

# MODE=keep_list -> видаляється все, КРІМ цих репозиторіїв
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

# MODE=pattern -> видаляються лише репозиторії, назва яких підходить під grep -E шаблон
PATTERN="^test-|^old-|-backup$"

# ========================================

mapfile -t all_repos < <(gh repo list "$USERNAME" --limit 1000 --json name -q '.[].name')

if [ "${#all_repos[@]}" -eq 0 ]; then
  echo "Не знайдено жодного репозиторію для $USERNAME."
  exit 0
fi

to_delete=()
for repo in "${all_repos[@]}"; do
  case "$MODE" in
    all)
      to_delete+=("$repo")
      ;;
    keep_list)
      keep=false
      if [ "${#KEEP[@]}" -gt 0 ]; then
        for k in "${KEEP[@]}"; do
          [[ "$repo" == "$k" ]] && keep=true
        done
      fi
      [ "$keep" = false ] && to_delete+=("$repo")
      ;;
    pattern)
      echo "$repo" | grep -qE "$PATTERN" && to_delete+=("$repo")
      ;;
  esac
done

echo "Знайдено репозиторіїв: ${#all_repos[@]}. Буде видалено: ${#to_delete[@]}"

if [ "${#to_delete[@]}" -eq 0 ]; then
  echo "Немає що видаляти згідно з поточними налаштуваннями."
  exit 0
fi

printf '  - %s\n' "${to_delete[@]}"

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "Це DRY RUN — нічого не видалено."
  echo "Перевірте список вище і поставте DRY_RUN=false, щоб видалити насправді."
  exit 0
fi

echo ""
read -rp "Введіть 'DELETE' щоб підтвердити НЕЗВОРОТНЕ видалення ${#to_delete[@]} репозиторіїв: " confirm
if [ "$confirm" != "DELETE" ]; then
  echo "Скасовано."
  exit 1
fi

for repo in "${to_delete[@]}"; do
  echo "Видаляю: $repo"
  gh repo delete "$USERNAME/$repo" --yes
  sleep 1
done

echo "Готово. Видалено ${#to_delete[@]} репозиторіїв."
