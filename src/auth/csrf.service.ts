import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CsrfService {
  generateToken() {
    return crypto.randomBytes(24).toString('hex');
  }
}
