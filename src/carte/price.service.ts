import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PriceRequestDto } from '../steriwave/dto/price.dto';

@Injectable()
export class PriceService {
  constructor(private readonly firebase: FirebaseService) {}

  async getTotalPrice(dto: PriceRequestDto): Promise<{
    totalPrice: number;
    totalCount: number;
    totalWorking: number;
    totalSoldThisWeek: number;
    sterilizersByUser: { email: string; count: number }[];
    salesPerDay: { [date: string]: number };
  }> {
    const db = this.firebase.db;
    let totalPrice = 0;
    let totalCount = 0;
    let totalWorking = 0;
    let totalSoldThisWeek = 0;

    const userSterilizerMap: Map<string, number> = new Map();
    const salesPerDayMap: Map<string, number> = new Map();

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // dimanche
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // samedi

    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userAdmin = userData.admin || '';
      const userEmail = userData.email || 'inconnu';

      if (dto.role === 'visor' && userAdmin !== dto.email) {
        continue;
      }

      const sterilizersSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('sterilisateurs')
        .get();

      let validSterilizerCount = 0;

      for (const sterilizerDoc of sterilizersSnapshot.docs) {
        const data = sterilizerDoc.data();

        if (!data || Object.keys(data).length === 0 || !data.id || !data.price) {
          continue;
        }

        const price = parseFloat(data.price || '0');
        const createdAt = new Date((data.createdAt || '').trim());

        totalPrice += price;
        totalCount += 1;
        validSterilizerCount += 1;

        if (data.work === true) {
          totalWorking += 1;
        }

        if (
          data.vendue === true &&
          createdAt >= startOfWeek &&
          createdAt <= endOfWeek
        ) {
          totalSoldThisWeek += price;
        }

        // 🟦 Ajouter au salesPerDay
        if (
          data.vendue === true &&
          createdAt instanceof Date &&
          !isNaN(createdAt.getTime())
        ) {
          const dayKey = createdAt.toISOString().split('T')[0]; // ex: 2025-04-22
          const prevCount = salesPerDayMap.get(dayKey) || 0;
          salesPerDayMap.set(dayKey, prevCount + 1);
        }
      }

      if (validSterilizerCount > 0) {
        const prev = userSterilizerMap.get(userEmail) || 0;
        userSterilizerMap.set(userEmail, prev + validSterilizerCount);
      }
    }

    const sterilizersByUser = Array.from(userSterilizerMap.entries()).map(
      ([email, count]) => ({ email, count })
    );

    const salesPerDay = Object.fromEntries(salesPerDayMap.entries());

    return {
      totalPrice,
      totalCount,
      totalWorking,
      totalSoldThisWeek,
      sterilizersByUser,
      salesPerDay,
    };
  }
}
