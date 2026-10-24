
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "chessclub";

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

const client = new MongoClient(uri);

const pairs = [
  ["The moon is very beautiful tonight ❤️", "Луната изглежда много красива тази вечер. ❤️"],
  ["I love you to the moon and back ❤️", "Обичам те до луната и обратно. ❤️"],
  ["You are very handsome ❤️", "Ти си много красив. ❤️"],
  ["Could I please get a large coffee, black, no sugar? ❤️", "Може ли едно голямо кафе, черно, без захар, моля? ❤️"],
  ["Let's go for a walk ❤️", "Хайде да се разходим. ❤️"],
  ["Sweet dreams ❤️", "Сладки сънища. ❤️"],
  ["Good luck, have fun ❤️", "Успех, забавлявай се. ❤️"],
  ["Bulgarian is hard ❤️", "Българският е труден. ❤️"],
  ["I speak very little Bulgarian ❤️", "Говоря много малко български. ❤️"],
  ["I'm learning Bulgarian ❤️", "Аз уча български. ❤️"],
  ["It's hot, bro. It's very hot. ❤️", "Горещо е, братле. Много е горещо. ❤️"],
  ["I'm tired, boss. ❤️", "Уморен съм, шефе. ❤️"],
  ["My name is Ashlee. Nice to meet you. ❤️", "Казвам се Ашли. Приятно ми е да се запознаем. ❤️"],
  ["Do you want to play chess? ❤️", "Искаш ли да играем шах? ❤️"],
  ["What do you want to do? ❤️", "Какво искаш да направиш? ❤️"],
  ["What do you want to eat? ❤️", "Какво искаш да ядеш? ❤️"],
  ["I'm 29 years old. ❤️", "Аз съм на двадесет и девет години. ❤️"],
  ["Would you like a hot drink? ❤️", "Искаш ли топла напитка? ❤️"],
  ["I have to sleep. ❤️", "Трябва да спя. ❤️"],
  ["It's getting late. ❤️", "Става късно. ❤️"],
  ["I'm hungry. ❤️", "Гладен съм. ❤️"],
  ["I'm thirsty. ❤️", "Жаден съм. ❤️"],
  ["Everything will be ok. ❤️", "Всичко ще бъде наред. ❤️"],
  ["Call me. ❤️", "Обади ми се. ❤️"],
  ["Let's go to the movies. ❤️", "Хайде да отидем на кино. ❤️"],
  ["Is there a toilet here? ❤️", "Има ли тоалетна тук? ❤️"],
  ["I miss you. ❤️", "Липсваш ми. ❤️"],
  ["I don't know. ❤️", "Не знам. ❤️"],
  ["Any Bulgarians in the chat? ❤️", "Има ли българи в чата? ❤️"],
  ["I resign. ❤️", "Предавам се. ❤️"],
  ["I need coffee and food. ❤️", "Имам нужда от кафе и храна. ❤️"],
  ["Well played. ❤️", "Добре изиграно. ❤️"],
  ["Bravo, nice game. ❤️", "Браво, хубава игра. ❤️"],
  ["I want to stream. ❤️", "Искам да стриймвам. ❤️"],
  ["I want to play chess. ❤️", "Искам да играя шах. ❤️"],
  ["I want to stream and play chess. ❤️", "Искам да стриймвам и да играя шах. ❤️"],
  ["Get well soon. ❤️", "Дано оздравееш скоро. ❤️"],
  ["Happy women's day. ❤️", "Честит ден на жената. ❤️"],
  ["Elephant Gambit ❤️", "Слонски гамбит. ❤️"],
  ["Brilliant ❤️", "Брилянтен. ❤️"],
  ["Checkmate ❤️", "Мат. ❤️"],
  ["Are you hungry? (to a female) ❤️", "Гладна ли си? ❤️"],
  ["Are you hungry? (to a male) ❤️", "Гладен ли си? ❤️"],
];

async function main() {
  try {
    await client.connect();

    const collection = client.db(dbName).collection("phrases");

    await collection.createIndex({ english: 1 }, { unique: true });

    const now = new Date();

    const result = await collection.bulkWrite(
      pairs.map(([english, bulgarian]) => ({
        updateOne: {
          filter: { english },
          update: {
            $setOnInsert: {
              english,
              bulgarian,
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    console.log("Seeding completed:", {
      total: pairs.length,
      inserted: result.upsertedCount,
      alreadyExisted: result.matchedCount,
    });
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
