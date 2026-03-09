import "reflect-metadata";
import { container } from "tsyringe";
import { TOKENS } from "./tokens";
import { BlockchainService } from "../services/blockchain.service";
import { SemaphoreService } from "../services/semaphore.service";
import { EventService } from "../services/event.service";
import { SemaphoreController } from "../controllers/semaphore.controller";
import { EventController } from "../controllers/event.controller";

container.registerSingleton(TOKENS.BlockchainService, BlockchainService);
container.registerSingleton(TOKENS.SemaphoreService, SemaphoreService);
container.registerSingleton(TOKENS.EventService, EventService);
container.registerSingleton(SemaphoreController);
container.registerSingleton(EventController);

export { container, TOKENS };
