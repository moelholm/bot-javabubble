import * as dotenv from "dotenv";
dotenv.config();

import {announceNewAccounts} from './announce-new-accounts-service';
import {announceOldAccounts} from './announce-old-accounts-service';

const arg = process.argv.slice(2)[0];
console.log(`Started with argument: [${arg}]`);

if (arg === 'announce-new-accounts') {
    announceNewAccounts();
} else if (arg === 'announce-old-accounts') {
    announceOldAccounts();
}
