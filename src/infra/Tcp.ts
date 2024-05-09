import "reflect-metadata";
import express from "express";
import { useExpressServer } from "routing-controllers";
import "dotenv/config";

import { IService } from "types/services";
import { controllers } from "app/domain";
import { middlewares } from "app/middlewares";


const PORT = process.env.PORT;

export class Tcp implements IService {
  private static instance: Tcp;

  private routePrefix = "/api";
  public server = express();

  constructor() {
    if (!Tcp.instance) {
      Tcp.instance = this;
    }
    return Tcp.instance;
  }

  async init() {
    const { server, routePrefix } = this;

    server.use(express.json());

    useExpressServer(server, {
      routePrefix,
      controllers,
      middlewares,
      cors: true,
      defaultErrorHandler: true,
      validation: false,
    });

    return new Promise<boolean>(resolve => {
      server.listen(PORT, () => {
        console.log(`Tcp service started on port ${PORT}`);

        return resolve(true);
      });
    });
  }
}
