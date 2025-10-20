import { Module } from '@nestjs/common';
import { FirebaseHistoryConsumer } from '././firebase-history.consumer';

@Module({
  providers: [FirebaseHistoryConsumer],
})
export class FirebaseHistoryModule {}
