import { Client, Connection } from '@temporalio/client';
import config from '../../config';

export class TemporalCoreService {
  private connection: Connection | undefined
  private client: Client | undefined

  constructor() { }

  protected async getClient(): Promise<Client> {
    if (!this.client) {
      if (!this.connection) {
        this.connection = await Connection.connect({ address: config.temporal.uri });
      }
      this.client = new Client({ connection: this.connection })
    }
    return this.client
  }

}