#!/bin/bash

# Migration Safety Analyzer
# Analyzes generated migration files for potential data loss risks
# Usage: ./scripts/analyze-migration-safety.sh [migration_file]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Analyzing Migration Safety...${NC}"

MIGRATION_FILE="$1"
MIGRATION_DIR="drizzle/migrations"

if [ -z "$MIGRATION_FILE" ]; then
    # Get the latest migration file
    MIGRATION_FILE=$(ls -t "$MIGRATION_DIR"/*.sql | head -n 1)
    echo -e "${YELLOW}📄 Analyzing latest migration: $(basename "$MIGRATION_FILE")${NC}"
else
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
        exit 1
    fi
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ No migration files found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Analyzing: $(basename "$MIGRATION_FILE")${NC}"
echo ""

RISK_LEVEL=0
WARNINGS=()
ERRORS=()
INFO=()

# Check for dangerous patterns
echo -e "${BLUE}🔍 Checking for dangerous patterns...${NC}"

# 1. Check for DROP TABLE statements
if grep -q "DROP TABLE" "$MIGRATION_FILE"; then
    RISK_LEVEL=3
    ERRORS+=("🚨 HIGH RISK: Contains DROP TABLE statements - potential data loss!")
    echo -e "${RED}❌ DROP TABLE statements found${NC}"
else
    echo -e "${GREEN}✅ No DROP TABLE statements${NC}"
fi

# 2. Check for table recreation pattern
if grep -q "__new_" "$MIGRATION_FILE"; then
    if [ $RISK_LEVEL -lt 2 ]; then RISK_LEVEL=2; fi
    WARNINGS+=("⚠️  MEDIUM RISK: Table recreation pattern detected")
    echo -e "${YELLOW}⚠️  Table recreation pattern found${NC}"

    # Check if INSERT INTO ... SELECT exists
    if grep -q "INSERT INTO.*__new_.*SELECT" "$MIGRATION_FILE"; then
        echo -e "${GREEN}  ✅ Data copy statements found${NC}"
        INFO+=("✅ Data copy statements present")
    else
        ERRORS+=("🚨 HIGH RISK: Table recreation without data copy!")
        RISK_LEVEL=3
        echo -e "${RED}  ❌ Missing data copy statements${NC}"
    fi
else
    echo -e "${GREEN}✅ No table recreation pattern${NC}"
fi

# 3. Check for DELETE statements
if grep -qi "DELETE FROM" "$MIGRATION_FILE"; then
    if [ $RISK_LEVEL -lt 2 ]; then RISK_LEVEL=2; fi
    WARNINGS+=("⚠️  MEDIUM RISK: Contains DELETE statements")
    echo -e "${YELLOW}⚠️  DELETE statements found${NC}"
else
    echo -e "${GREEN}✅ No DELETE statements${NC}"
fi

# 4. Check for foreign key manipulation
if grep -q "PRAGMA foreign_keys=OFF" "$MIGRATION_FILE"; then
    if [ $RISK_LEVEL -lt 1 ]; then RISK_LEVEL=1; fi
    WARNINGS+=("⚠️  LOW RISK: Foreign keys temporarily disabled")
    echo -e "${YELLOW}⚠️  Foreign key manipulation found${NC}"
else
    echo -e "${GREEN}✅ No foreign key manipulation${NC}"
fi

# 5. Check for ALTER TABLE operations
if grep -q "ALTER TABLE" "$MIGRATION_FILE"; then
    if [ $RISK_LEVEL -lt 1 ]; then RISK_LEVEL=1; fi
    INFO+=("ℹ️  Contains ALTER TABLE operations")
    echo -e "${BLUE}ℹ️  ALTER TABLE operations found${NC}"
else
    echo -e "${GREEN}✅ No ALTER TABLE operations${NC}"
fi

echo ""
echo -e "${BLUE}📊 Risk Assessment${NC}"

case $RISK_LEVEL in
    0)
        echo -e "${GREEN}🟢 LOW RISK - Migration appears safe${NC}"
        ;;
    1)
        echo -e "${YELLOW}🟡 MEDIUM-LOW RISK - Review recommended${NC}"
        ;;
    2)
        echo -e "${YELLOW}🟠 MEDIUM RISK - Careful review required${NC}"
        ;;
    3)
        echo -e "${RED}🔴 HIGH RISK - Dangerous migration detected!${NC}"
        ;;
esac

echo ""

# Display findings
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo -e "${RED}🚨 ERRORS:${NC}"
    for error in "${ERRORS[@]}"; do
        echo -e "  ${RED}  $error${NC}"
    done
    echo ""
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS:${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo -e "  ${YELLOW}  $warning${NC}"
    done
    echo ""
fi

if [ ${#INFO[@]} -gt 0 ]; then
    echo -e "${BLUE}ℹ️  INFORMATION:${NC}"
    for info in "${INFO[@]}"; do
        echo -e "  ${BLUE}  $info${NC}"
    done
    echo ""
fi

# Recommendations
echo -e "${BLUE}💡 RECOMMENDATIONS:${NC}"

if [ $RISK_LEVEL -ge 2 ]; then
    echo -e "${RED}  🛑 HIGH RISK ACTIONS REQUIRED:${NC}"
    echo -e "    1. Create backup: pnpm migrate:backup"
    echo -e "    2. Review migration manually"
    echo -e "    3. Test on staging environment first"
    echo -e "    4. Use safe migration command: pnpm migrate:safe-local"
    echo ""
fi

if [ $RISK_LEVEL -ge 1 ]; then
    echo -e "${YELLOW}  ⚠️  PRECAUTIONS:${NC}"
    echo -e "    1. Review migration content carefully"
    echo -e "    2. Ensure backups are current"
    echo -e "    3. Validate after migration"
    echo ""
fi

if [ $RISK_LEVEL -eq 0 ]; then
    echo -e "${GREEN}  ✅ Migration appears safe to proceed${NC}"
    echo -e "    Still recommended to use: pnpm migrate:safe-local"
    echo ""
fi

echo -e "${BLUE}📄 Migration File Preview:${NC}"
echo "----------------------------------------"
head -20 "$MIGRATION_FILE"
echo "----------------------------------------"
echo ""

# Exit with error code if high risk
if [ $RISK_LEVEL -eq 3 ]; then
    echo -e "${RED}❌ HIGH RISK MIGRATION - Please review before applying${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Migration analysis completed${NC}"
    exit 0
fi