import { createClient } from 'redis';

const url = 'redis://default:c6ZsiUDWFcnDswpsGZPMHyS9QHI6kHdS@redis-14120.c73.us-east-1-2.ec2.cloud.redislabs.com:14120';

async function test() {
    console.log('Testing connection to:', url);
    const client = createClient({ url });

    client.on('error', (err) => console.error('Redis Client Error', err));

    try {
        await client.connect();
        console.log('Connected!');
        await client.set('test_key', 'Hello Redis');
        const value = await client.get('test_key');
        console.log('Got value:', value);
        await client.disconnect();
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

test();
