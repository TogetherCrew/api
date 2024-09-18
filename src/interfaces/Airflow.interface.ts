import { type ObjectId } from 'mongodb';
import { type Snowflake } from 'discord.js';

export interface IDiscourseDagConfig {
  platform_id: ObjectId;
  id: Snowflake;
  period: Date;
  recompute: boolean;
}
