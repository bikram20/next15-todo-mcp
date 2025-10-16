#!/bin/bash

# MCP API Test Script
# Tests the MCP endpoint with curl commands for all 5 tools
# Usage: ./tests/mcp-api.sh [http://localhost:3000]

BASE_URL="${1:-http://localhost:3000}"
MCP_ENDPOINT="$BASE_URL/api/mcp"
TESTS_PASSED=0
TESTS_FAILED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "MCP Endpoint Test Suite"
echo "=========================================="
echo "Testing: $MCP_ENDPOINT"
echo ""

# Helper function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local params=$3
    local expected_in_response=$4
    
    echo -n "Testing: $test_name... "
    
    if [ -z "$params" ]; then
        params="{}"
    fi
    
    response=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "{
            \"jsonrpc\": \"2.0\",
            \"method\": \"$method\",
            \"params\": $params,
            \"id\": 1
        }")
    
    # Check if response contains expected text
    if echo "$response" | grep -q "$expected_in_response"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: List available tools
test_endpoint \
    "List available tools" \
    "tools/list" \
    "{}" \
    "ping"

# Test 2: Verify all 5 tools exist
echo -n "Verifying all 5 tools exist... "
response=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "tools/list",
        "params": {},
        "id": 1
    }')

tool_count=$(echo "$response" | grep -o '"name"' | wc -l)
if [ "$tool_count" -eq 5 ]; then
    echo -e "${GREEN}✓ PASS${NC} (5 tools found)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 5 tools, found $tool_count)"
    ((TESTS_FAILED++))
fi

# Test 3: Ping tool
test_endpoint \
    "Ping tool (health check)" \
    "tools/call" \
    "{\"name\": \"ping\", \"arguments\": {}}" \
    "Pong"

# Test 4: Get tasks
test_endpoint \
    "Get all tasks" \
    "tools/call" \
    "{\"name\": \"getTasks\", \"arguments\": {}}" \
    "success"

# Test 5: Add task
TASK_TITLE="Test Task $(date +%s)"
test_endpoint \
    "Add new task" \
    "tools/call" \
    "{\"name\": \"addTask\", \"arguments\": {\"title\": \"$TASK_TITLE\"}}" \
    "success"

# Test 6: Add task with empty title (should fail)
echo -n "Testing add task with empty title (should fail)... "
response=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {"name": "addTask", "arguments": {"title": ""}},
        "id": 1
    }')

if echo "$response" | grep -q "isError.*true\|error"; then
    echo -e "${GREEN}✓ PASS${NC} (Error returned as expected)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Should have returned error)"
    echo "  Response: $response"
    ((TESTS_FAILED++))
fi

# Test 7: Get tasks and extract ID for further tests
echo -n "Getting task list for subsequent tests... "
response=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {"name": "getTasks", "arguments": {}},
        "id": 1
    }')

# Extract first task ID
TASK_ID=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -n "$TASK_ID" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Task ID: $TASK_ID)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⊘ SKIP${NC} (No tasks available)"
    TASK_ID=1
fi

# Test 8: Complete task
if [ "$TASK_ID" != "1" ] || [ -n "$(echo "$response" | grep -o '"id"')" ]; then
    test_endpoint \
        "Complete task" \
        "tools/call" \
        "{\"name\": \"completeTask\", \"arguments\": {\"id\": $TASK_ID}}" \
        "success\|Task.*completed"
fi

# Test 9: Delete task
test_endpoint \
    "Delete task" \
    "tools/call" \
    "{\"name\": \"deleteTask\", \"arguments\": {\"id\": $TASK_ID}}" \
    "success\|deleted"

# Test 10: Invalid tool name (should error)
echo -n "Testing invalid tool (should return error)... "
response=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {"name": "invalidTool", "arguments": {}},
        "id": 1
    }')

if echo "$response" | grep -q "error"; then
    echo -e "${GREEN}✓ PASS${NC} (Error returned as expected)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Should have returned error)"
    echo "  Response: $response"
    ((TESTS_FAILED++))
fi

# Test 11: JSON-RPC 2.0 format compliance
echo -n "Verifying JSON-RPC 2.0 format... "
response=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "tools/list",
        "params": {},
        "id": 42
    }')

if echo "$response" | grep -q '"jsonrpc":"2.0"' && echo "$response" | grep -q '"id":42'; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Response: $response"
    ((TESTS_FAILED++))
fi

# Test 12: Multiple concurrent requests
echo -n "Testing concurrent requests... "
response1=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "ping", "arguments": {}}, "id": 1}' &)

response2=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "ping", "arguments": {}}, "id": 2}' &)

wait
if echo "$response1" | grep -q "Pong" && echo "$response2" | grep -q "Pong"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
