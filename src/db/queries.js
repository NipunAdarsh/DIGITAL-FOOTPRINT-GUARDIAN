// ============================================================
// DATABASE QUERIES — All Supabase operations
// PRD Section 7.6 + extended for new pages
// ============================================================

import { supabase } from '../utils/supabaseClient'

// ── SCANS ────────────────────────────────────────────────────

export async function saveScan({ emailHash, emailMasked, breachCount, riskScore, riskLevel, aiSummary }) {
  const { data, error } = await supabase
    .from('scans')
    .insert({ email_hash: emailHash, email_masked: emailMasked, breach_count: breachCount, risk_score: riskScore, risk_level: riskLevel, ai_summary: aiSummary })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRecentScans(limit = 20) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getHighRiskScans(limit = 10) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .in('risk_level', ['HIGH', 'CRITICAL'])
    .order('risk_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// ── BREACH RECORDS ────────────────────────────────────────────

export async function saveBreaches(scanId, breaches) {
  if (!breaches || !breaches.length) return
  const rows = breaches.map(b => ({
    scan_id:      scanId,
    site_name:    b.Title,
    site_domain:  b.Domain,
    breach_date:  b.BreachDate,
    pwn_count:    b.PwnCount,
    data_classes: b.DataClasses,
    is_sensitive: b.IsSensitive,
    is_verified:  b.IsVerified,
  }))
  const { error } = await supabase.from('breach_records').insert(rows)
  if (error) throw error
}

export async function getBreachRecordsForScan(scanId) {
  const { data, error } = await supabase
    .from('breach_records')
    .select('*')
    .eq('scan_id', scanId)
    .order('breach_date', { ascending: false })
  if (error) throw error
  return data || []
}

// ── REMEDIATION STEPS ─────────────────────────────────────────

export async function saveRemediationSteps(scanId, steps) {
  if (!steps || !steps.length) return
  const rows = steps.map((s, i) => ({
    scan_id:    scanId,
    step_order: i + 1,
    priority:   s.priority,
    action:     s.action,
    reason:     s.reason,
    time_to_fix: s.timeToFix || s.time_to_fix || '',
  }))
  const { error } = await supabase.from('remediation_steps').insert(rows)
  if (error) throw error
}

export async function getRemediationStepsForScan(scanId) {
  const { data, error } = await supabase
    .from('remediation_steps')
    .select('*')
    .eq('scan_id', scanId)
    .order('step_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function markRemediationComplete(stepId, isCompleted) {
  const { error } = await supabase
    .from('remediation_steps')
    .update({ is_completed: isCompleted })
    .eq('id', stepId)
  if (error) throw error
}

// ── PASSWORD CHECKS ───────────────────────────────────────────

export async function savePasswordCheck({ strengthScore, strengthLabel, entropyBits, crackTime, patternsFound, aiFeedback }) {
  const { data, error } = await supabase
    .from('password_checks')
    .insert({ strength_score: strengthScore, strength_label: strengthLabel, entropy_bits: entropyBits, crack_time: crackTime, patterns_found: patternsFound, ai_feedback: aiFeedback })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRecentPasswordChecks(limit = 10) {
  const { data, error } = await supabase
    .from('password_checks')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// ── URL CHECKS ────────────────────────────────────────────────

export async function saveUrlCheck({ urlHash, urlDomain, verdict, riskSignals, signalCount, aiVerdict }) {
  const { data, error } = await supabase
    .from('url_checks')
    .insert({ url_hash: urlHash, url_domain: urlDomain, verdict, risk_signals: riskSignals, signal_count: signalCount, ai_verdict: aiVerdict })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRecentUrlChecks(limit = 10) {
  const { data, error } = await supabase
    .from('url_checks')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// ── DATA BROKER REMOVALS ──────────────────────────────────────

export async function getDataBrokers() {
  const { data, error } = await supabase
    .from('data_broker_removals')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function updateBrokerStatus(id, status) {
  const updateData = {
    removal_status: status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'PENDING' || status === 'IN_PROGRESS') {
    updateData.date_requested = new Date().toISOString()
  }
  if (status === 'CONFIRMED') {
    updateData.date_confirmed = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from('data_broker_removals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addCustomBroker({ brokerName, brokerCategory, dataFound }) {
  const { data, error } = await supabase
    .from('data_broker_removals')
    .insert({ broker_name: brokerName, broker_category: brokerCategory || 'Custom', data_found: dataFound || [], removal_status: 'NOT_REQUESTED' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── PLATFORM STATS ────────────────────────────────────────────

export async function getPlatformStats() {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .single()
  if (error) {
    console.warn('[DB] platform_stats error:', error.message)
    return null
  }
  return data
}
