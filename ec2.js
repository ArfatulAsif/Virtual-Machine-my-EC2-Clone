import {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
} from '@aws-sdk/client-ec2'

// Endpoint goes through the Vite proxy (/aws -> http://localhost:4566).
// floci accepts any non-empty credentials.
const client = new EC2Client({
  region: 'us-east-1',
  endpoint: `${window.location.origin}/aws`,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
})

export async function listInstances() {
  const out = await client.send(new DescribeInstancesCommand({}))
  const instances = []
  for (const r of out.Reservations ?? []) {
    for (const i of r.Instances ?? []) {
      instances.push({
        id: i.InstanceId,
        type: i.InstanceType,
        state: i.State?.Name,
        image: i.ImageId,
        publicIp: i.PublicIpAddress,
        privateIp: i.PrivateIpAddress,
        launchTime: i.LaunchTime,
        name: (i.Tags ?? []).find((t) => t.Key === 'Name')?.Value,
      })
    }
  }
  return instances
}

export function launchInstance({ imageId, instanceType, name, count = 1 }) {
  return client.send(
    new RunInstancesCommand({
      ImageId: imageId,
      InstanceType: instanceType,
      MinCount: count,
      MaxCount: count,
      TagSpecifications: name
        ? [{ ResourceType: 'instance', Tags: [{ Key: 'Name', Value: name }] }]
        : undefined,
    }),
  )
}

export const startInstance = (id) =>
  client.send(new StartInstancesCommand({ InstanceIds: [id] }))
export const stopInstance = (id) =>
  client.send(new StopInstancesCommand({ InstanceIds: [id] }))
export const rebootInstance = (id) =>
  client.send(new RebootInstancesCommand({ InstanceIds: [id] }))
export const terminateInstance = (id) =>
  client.send(new TerminateInstancesCommand({ InstanceIds: [id] }))
