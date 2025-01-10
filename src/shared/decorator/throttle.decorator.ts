import { Reflector } from "@nestjs/core";

export interface IThrottleOptions {
  count: number;
  unit: "minute";
}

export const Throttle =
  Reflector.createDecorator<IThrottleOptions>();
