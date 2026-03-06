/**
 * Lightweight in-memory store for dynamically created jobs.
 * Written by JobListContent, read by JobDetailPage.
 */
import type { JobRecord } from './jobData'

const _store = new Map<string, JobRecord>()

export function upsertJob(job: JobRecord): void {
  _store.set(job.id, { ...job })
}

export function findDynamicJob(id: string): JobRecord | undefined {
  return _store.get(id)
}
