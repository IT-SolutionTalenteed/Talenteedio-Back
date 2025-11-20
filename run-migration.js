"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./src/database"));
function runMigrations() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Initializing database connection...');
            yield database_1.default.initialize();
            console.log('Running migrations...');
            const migrations = yield database_1.default.runMigrations();
            if (migrations.length === 0) {
                console.log('No migrations to run.');
            }
            else {
                console.log(`Successfully ran ${migrations.length} migration(s):`);
                migrations.forEach(migration => {
                    console.log(`  - ${migration.name}`);
                });
            }
            yield database_1.default.destroy();
            console.log('Database connection closed.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error running migrations:', error);
            process.exit(1);
        }
    });
}
runMigrations();
