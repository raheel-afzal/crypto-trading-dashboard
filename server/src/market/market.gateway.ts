import type { OnModuleDestroy } from "@nestjs/common";
import {
  type OnGatewayConnection,
  type OnGatewayInit,
  WebSocketGateway,
} from "@nestjs/websockets";
import type { Subscription } from "rxjs";
import { WebSocket, type WebSocketServer } from "ws";
import type { Coin } from "./coins.js";
import { MarketService } from "./market.service.js";

function toMessage(coins: Coin[]): string {
  return JSON.stringify({ event: "prices", data: coins });
}

@WebSocketGateway({ path: "/ws" })
export class MarketGateway
  implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy
{
  private subscription?: Subscription;

  constructor(private readonly market: MarketService) {}

  afterInit(server: WebSocketServer) {
    this.subscription = this.market.ticks$.subscribe((coins) => {
      const message = toMessage(coins);
      for (const client of server.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(message);
      }
    });
  }

  handleConnection(client: WebSocket) {
    client.send(toMessage(this.market.getCoins()));
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }
}
