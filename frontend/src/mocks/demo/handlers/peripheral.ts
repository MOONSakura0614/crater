import { HttpResponse, http } from 'msw'

import { Role } from '@/services/api/auth'

import { findAccountByToken } from '../accounts'
import { DEMO_IMAGES } from '../fixtures/images'
import { DEMO_JOBS, type DemoJob, findJob, jobsForOwner } from '../fixtures/jobs'
import { DEMO_NODES, findNode, type DemoNode } from '../fixtures/nodes'
import { DEMO_QUEUES } from '../fixtures/queues'
import { DEMO_QUOTAS } from '../fixtures/quotas'

const baseURL = import.meta.env.VITE_SERVER_PROXY_BACKEND ?? ''

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, msg: '', data })
}

function bearer(request: Request): string | null {
  return request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null
}

function toJobInfo(job: DemoJob) {
  return {
    name: job.name,
    jobName: job.name,
    owner: job.owner,
    userInfo: { username: job.owner, nickname: job.owner === 'alice' ? 'Alice 研究员' : job.owner },
    jobType: job.jobType,
    scheduleType: 1,
    queue: job.account,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? '',
    completedAt: job.failedAt ?? '',
    nodes: job.status === 'Running' || job.status === 'Failed' ? ['gpu-node-01'] : [],
    resources: {
      cpu: job.cpuRequest,
      memory: job.memoryRequest,
      'nvidia.com/gpu': String(job.gpuRequest),
    },
    locked: false,
    permanentLocked: false,
  }
}

function toJobDetail(job: DemoJob) {
  const events =
    job.status === 'Failed'
      ? [
          { reason: 'Scheduled', message: '调度到节点 gpu-node-01', count: 1, type: 'Normal', firstTimestamp: job.startedAt },
          { reason: 'Pulled', message: 'Image pull completed', count: 1, type: 'Normal', firstTimestamp: job.startedAt },
          {
            reason: 'OOMKilled',
            message: `Container terminated with exit code ${job.exitCode}: ${job.reason}`,
            count: 1,
            type: 'Warning',
            firstTimestamp: job.failedAt,
          },
        ]
      : job.status === 'Pending'
        ? [
            {
              reason: 'FailedScheduling',
              message: '0/6 nodes are available: 4 Insufficient nvidia.com/gpu',
              count: 8,
              type: 'Warning',
              firstTimestamp: job.createdAt,
            },
          ]
        : [
            { reason: 'Scheduled', message: '调度到节点 gpu-node-01', count: 1, type: 'Normal', firstTimestamp: job.startedAt },
          ]
  return {
    name: job.name,
    namespace: 'crater',
    username: job.owner,
    nickname: job.owner === 'alice' ? 'Alice 研究员' : job.owner,
    jobType: job.jobType,
    status: job.status,
    queue: job.account,
    image: job.image,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? '',
    completedAt: job.failedAt ?? '',
    resources: { cpu: job.cpuRequest, memory: job.memoryRequest, 'nvidia.com/gpu': String(job.gpuRequest) },
    events,
    failureReason: job.reason ?? '',
    exitCode: job.exitCode,
  }
}

function toNodeBrief(node: DemoNode) {
  const gpuCap = node.gpuTotal > 0 ? { 'nvidia.com/gpu': String(node.gpuTotal) } : {}
  const gpuUsed = node.gpuTotal > 0 ? { 'nvidia.com/gpu': String(node.gpuUsed) } : {}
  return {
    name: node.name,
    role: 'worker',
    arch: 'amd64',
    status:
      node.status === 'Degraded'
        ? 'Occupied'
        : node.status === 'NotReady'
          ? 'NotReady'
          : 'Ready',
    vendor: node.gpuModel?.includes('NVIDIA') ? 'nvidia' : '',
    taints: node.taints?.map((t) => ({ key: t, value: '', effect: 'NoSchedule' })) ?? [],
    capacity: { cpu: node.cpuTotal, memory: node.memoryTotal, ...gpuCap },
    allocatable: { cpu: node.cpuTotal, memory: node.memoryTotal, ...gpuCap },
    used: { cpu: node.cpuUsed, memory: node.memoryUsed, ...gpuUsed },
    workloads: node.gpuUsed,
    annotations: {},
    kernelVersion: '5.15.0-105-generic',
    gpuDriver: '535.183.01',
    address: '10.0.0.10',
  }
}

function toNodeDetail(node: DemoNode) {
  return {
    name: node.name,
    role: 'worker',
    isReady: node.status === 'Ready' ? 'True' : 'False',
    time: '2026-05-10T00:00:00Z',
    address: '10.0.0.10',
    os: 'linux',
    osVersion: 'Ubuntu 22.04.4 LTS',
    arch: 'amd64',
    kubeletVersion: 'v1.28.5',
    containerRuntimeVersion: 'containerd://1.7.13',
    kernelVersion: '5.15.0-105-generic',
    capacity: {
      cpu: node.cpuTotal,
      memory: node.memoryTotal,
      ...(node.gpuTotal > 0 ? { 'nvidia.com/gpu': String(node.gpuTotal) } : {}),
    },
    allocatable: {
      cpu: node.cpuTotal,
      memory: node.memoryTotal,
      ...(node.gpuTotal > 0 ? { 'nvidia.com/gpu': String(node.gpuTotal) } : {}),
    },
    used: {
      cpu: node.cpuUsed,
      memory: node.memoryUsed,
      ...(node.gpuTotal > 0 ? { 'nvidia.com/gpu': String(node.gpuUsed) } : {}),
    },
    gpuDriver: '535.183.01',
    events: node.events,
    conditions: node.conditions,
  }
}

const JOB_URLS = ['vcjobs', 'aijobs', 'spjobs']

function jobUrlMatchers(pattern: string) {
  return JOB_URLS.map((u) => `${baseURL}api/v1/${pattern.replace(':url', u)}`)
}

export const peripheralHandlers = [
  // Job: list (user batch / interactive / all)
  ...jobUrlMatchers(':url').flatMap((url) => [
    http.get(url, ({ request }) => {
      const account = findAccountByToken(bearer(request))
      const jobs =
        account?.role === 'admin' ? DEMO_JOBS : jobsForOwner(account?.username ?? 'alice')
      return ok(jobs.map(toJobInfo))
    }),
  ]),

  ...jobUrlMatchers(':url/all').flatMap((url) => [
    http.get(url, () => ok(DEMO_JOBS.map(toJobInfo))),
  ]),

  // User's jobs (specific username)
  ...jobUrlMatchers(':url/user/:username').flatMap((url) => [
    http.get(url, ({ params }) =>
      ok(jobsForOwner(String(params.username)).map(toJobInfo))
    ),
  ]),

  // Admin job list (with days filter)
  ...jobUrlMatchers('admin/:url').flatMap((url) => [
    http.get(url, () => ok(DEMO_JOBS.map(toJobInfo))),
  ]),

  // Admin job detail
  ...jobUrlMatchers('admin/:url/:name/detail').flatMap((url) => [
    http.get(url, ({ params }) => {
      const job = findJob(String(params.name))
      return job ? ok(toJobDetail(job)) : HttpResponse.json({ code: 0, msg: '', data: null })
    }),
  ]),

  // User job detail / pods / yaml / event
  ...jobUrlMatchers(':url/:name/detail').flatMap((url) => [
    http.get(url, ({ params }) => {
      const job = findJob(String(params.name))
      return job ? ok(toJobDetail(job)) : HttpResponse.json({ code: 0, msg: '', data: null })
    }),
  ]),

  ...jobUrlMatchers(':url/:name/pods').flatMap((url) => [
    http.get(url, () => ok([])),
  ]),
  ...jobUrlMatchers(':url/:name/yaml').flatMap((url) => [
    http.get(url, () => ok('# demo yaml omitted')),
  ]),
  ...jobUrlMatchers(':url/:name/event').flatMap((url) => [
    http.get(url, ({ params }) => {
      const job = findJob(String(params.name))
      return ok(job ? toJobDetail(job).events : [])
    }),
  ]),

  // Nodes
  http.get(`${baseURL}api/v1/nodes`, () => ok(DEMO_NODES.map(toNodeBrief))),
  http.get(`${baseURL}api/v1/nodes/:name`, ({ params }) => {
    const node = findNode(String(params.name))
    return node ? ok(toNodeDetail(node)) : HttpResponse.json({ code: 0, msg: '', data: null })
  }),
  http.get(`${baseURL}api/v1/nodes/:name/pods`, () => ok([])),
  http.get(`${baseURL}api/v1/admin/nodes/:name/pods`, ({ params }) => {
    const nodeName = String(params.name)
    const jobs = DEMO_JOBS.filter(
      (j) => (j.status === 'Running' || j.status === 'Failed') && j.name.includes('') // all running/failed; node assignment is mocked
    ).slice(0, 3)
    if (nodeName === 'gpu-node-03') {
      // Match the 3 jobs flagged in AD-2 scenario
      return ok(
        ['cv-train-12', 'rl-train-04', 'big-job-1']
          .map((n) => findJob(n))
          .filter((j): j is NonNullable<typeof j> => Boolean(j))
          .map((j) => ({
            name: `${j.name}-master-0`,
            namespace: 'crater',
            ownerReference: [],
            ip: '10.0.1.20',
            createTime: j.createdAt,
            status: j.status,
            resources: { cpu: j.cpuRequest, memory: j.memoryRequest, 'nvidia.com/gpu': String(j.gpuRequest) },
            locked: false,
            permanentLocked: false,
            userName: j.owner,
            userID: 1000,
            userRealName: j.owner,
            accountName: j.account,
            accountID: 2000,
            accountRealName: j.account,
          }))
      )
    }
    return ok(
      jobs.map((j) => ({
        name: `${j.name}-master-0`,
        namespace: 'crater',
        ownerReference: [],
        ip: '10.0.1.20',
        createTime: j.createdAt,
        status: j.status,
        resources: { cpu: j.cpuRequest, memory: j.memoryRequest, 'nvidia.com/gpu': String(j.gpuRequest) },
        locked: false,
        permanentLocked: false,
        userName: j.owner,
        userID: 1000,
        userRealName: j.owner,
        accountName: j.account,
        accountID: 2000,
        accountRealName: j.account,
      }))
    )
  }),
  http.get(`${baseURL}api/v1/nodes/:name/gpu`, ({ params }) => {
    const node = findNode(String(params.name))
    return ok({
      name: String(params.name),
      haveGPU: (node?.gpuTotal ?? 0) > 0,
      devices: node && node.gpuTotal > 0
        ? [
            {
              resourceName: 'nvidia.com/gpu',
              label: node.gpuModel ?? '',
              product: node.gpuModel ?? '',
              vendorDomain: 'nvidia.com',
              count: node.gpuTotal,
              memory: '48Gi',
              arch: 'Ada Lovelace',
              driver: '535.183.01',
              runtimeVersion: '12.4',
            },
          ]
        : [],
    })
  }),

  // Accounts / queues
  http.get(`${baseURL}api/v1/accounts`, () =>
    ok(
      DEMO_QUEUES.map((q) => ({
        name: q.name,
        nickname: q.description,
        role: Role.User,
        access: 2,
      }))
    )
  ),

  // Admin queue-quotas
  http.get(`${baseURL}api/v1/admin/queue-quotas`, () =>
    ok({
      total: DEMO_QUOTAS.length,
      items: DEMO_QUOTAS.map((q) => ({
        id: q.accountId,
        accountId: q.accountId,
        accountName: q.accountName,
        gpu: q.gpu,
        cpu: q.cpu,
        memory: q.memoryGi,
        storage: q.storageGi,
      })),
    })
  ),

  // Labels
  http.get(`${baseURL}api/v1/labels`, () =>
    ok([
      { key: 'nvidia.com/gpu.product', values: ['NVIDIA-L40S', 'NVIDIA-A100', 'NVIDIA-RTX3090'] },
      { key: 'node-role.kubernetes.io/worker', values: [''] },
    ])
  ),

  // Images
  http.get(`${baseURL}api/v1/images/image`, () =>
    ok({
      total: DEMO_IMAGES.length,
      items: DEMO_IMAGES.map((img, i) => ({
        id: i + 1,
        imageRef: img.fullRef,
        description: img.description,
        framework: img.framework,
        cudaVersion: img.cudaVersion,
        size: img.size,
        pulls: img.pulls,
        authorized: img.authorized,
        createdAt: '2026-05-01T00:00:00Z',
      })),
    })
  ),
  http.get(`${baseURL}api/v1/images/kaniko`, () => ok({ total: 0, items: [] })),
  http.get(`${baseURL}api/v1/images/quota`, ({ request }) => {
    const account = findAccountByToken(bearer(request))
    const quota = DEMO_QUOTAS.find((q) => q.accountName === account?.accountName) ?? DEMO_QUOTAS[0]
    return ok({ name: quota.accountName, gpuUsed: quota.gpu.used, gpuLimit: quota.gpu.limit })
  }),
  http.get(`${baseURL}api/v1/images/harbor`, () =>
    ok({ ip: 'crater-harbor.act.buaa.edu.cn', port: 443 })
  ),
]
