#!/usr/bin/env node
/**
 * Calculate RTL Test Pass Rate
 * Reads Playwright JSON results and calculates pass percentage
 * 
 * Agent: qa-engineer
 * Phase: 0 - RTL Validation
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '..', 'reports', 'rtl-results.json');
const TOTAL_EXPECTED_TESTS = 50;

// Go/No-Go thresholds
const THRESHOLDS = {
    GO: 0.90,      // ≥90% (45/50)
    CAUTION: 0.80, // 80-89% (40-44)
    // <80% is NO-GO
};

function main() {
    console.log('\n📊 RTL Validation Pass Rate Calculator\n');
    console.log('='.repeat(50));

    // Check if results file exists
    if (!fs.existsSync(RESULTS_FILE)) {
        console.error('❌ Results file not found:', RESULTS_FILE);
        console.error('   Run: npm run test:rtl first');
        process.exit(1);
    }

    // Read and parse results
    const rawData = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const results = JSON.parse(rawData);

    // Extract test counts
    const stats = results.stats || {};
    const suites = results.suites || [];

    // Count tests recursively
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let total = 0;

    function countTests(suite) {
        if (suite.specs) {
            for (const spec of suite.specs) {
                for (const test of spec.tests || []) {
                    total++;
                    for (const result of test.results || []) {
                        if (result.status === 'passed') {
                            passed++;
                        } else if (result.status === 'failed') {
                            failed++;
                        } else if (result.status === 'skipped') {
                            skipped++;
                        }
                    }
                }
            }
        }
        if (suite.suites) {
            for (const childSuite of suite.suites) {
                countTests(childSuite);
            }
        }
    }

    for (const suite of suites) {
        countTests(suite);
    }

    // Use stats if available
    if (stats.expected !== undefined) {
        total = stats.expected;
        passed = stats.expected - (stats.unexpected || 0) - (stats.skipped || 0);
        failed = stats.unexpected || 0;
        skipped = stats.skipped || 0;
    }

    // Calculate pass rate
    const effectiveTotal = total > 0 ? total : TOTAL_EXPECTED_TESTS;
    const passRate = (passed / effectiveTotal) * 100;
    const passRateDecimal = passed / effectiveTotal;

    // Output results
    console.log(`\n📈 Test Results:`);
    console.log(`   Total Tests:  ${total}/${TOTAL_EXPECTED_TESTS} expected`);
    console.log(`   ✅ Passed:    ${passed}`);
    console.log(`   ❌ Failed:    ${failed}`);
    console.log(`   ⏭️  Skipped:   ${skipped}`);
    console.log(`   📊 Pass Rate: ${passRate.toFixed(1)}%`);
    console.log('');

    // Determine gate decision
    let decision = '';
    let emoji = '';

    if (passRateDecimal >= THRESHOLDS.GO) {
        decision = 'GO - PROCEED to Phase 1';
        emoji = '✅';
    } else if (passRateDecimal >= THRESHOLDS.CAUTION) {
        decision = 'CAUTION - PM reviews workarounds';
        emoji = '⚠️';
    } else {
        decision = 'NO-GO - ABORT and pivot to Obsidian';
        emoji = '❌';
    }

    console.log('='.repeat(50));
    console.log(`\n${emoji} Gate Decision: ${decision}\n`);
    console.log('='.repeat(50));

    // Generate summary for report
    const summary = {
        date: new Date().toISOString(),
        total,
        passed,
        failed,
        skipped,
        passRate: passRate.toFixed(1),
        decision,
        threshold: passRateDecimal >= THRESHOLDS.GO ? 'GO' :
            passRateDecimal >= THRESHOLDS.CAUTION ? 'CAUTION' : 'NO-GO',
    };

    // Write summary to JSON
    const summaryPath = path.join(__dirname, '..', 'reports', 'rtl-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Summary saved to: ${summaryPath}\n`);

    // Exit with appropriate code
    if (passRateDecimal < THRESHOLDS.CAUTION) {
        process.exit(1); // NO-GO
    }
    process.exit(0);
}

main();
