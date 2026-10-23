'use client';
import QuizGame from '@/components/QuizGame';

const puzzles = [
  { q: 'What comes next in the sequence: 2, 4, 8, 16, …?',                                                                      opts: ['18', '24', '32', '64'],                              a: 2 },
  { q: 'Which word does NOT belong: Apple, Banana, Carrot, Grape?',                                                              opts: ['Apple', 'Banana', 'Carrot', 'Grape'],                a: 2 },
  { q: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',                              opts: ['Yes', 'No', 'Maybe', 'Only some'],                   a: 0 },
  { q: 'A farmer has 17 sheep. All but 9 die. How many sheep does the farmer have left?',                                        opts: ['8', '9', '17', '0'],                                 a: 1 },
  { q: 'What number comes next: 1, 1, 2, 3, 5, 8, …?',                                                                          opts: ['10', '11', '13', '12'],                              a: 2 },
  { q: 'I have cities but no houses, forests but no trees, and water but no fish. What am I?',                                   opts: ['A dream', 'A painting', 'A map', 'A cloud'],         a: 2 },
  { q: 'If you have a 3-litre and a 5-litre jug, what is the minimum number of pours needed to measure exactly 4 litres?',      opts: ['2', '3', '4', '5'],                                  a: 1 },
  { q: 'Which is heavier: a tonne of feathers or a tonne of steel?',                                                             opts: ['Steel', 'Feathers', 'Neither — they weigh the same', 'Depends on volume'], a: 2 },
  { q: 'A rooster lays an egg on the peak of a roof. Which way does it roll?',                                                   opts: ['Left', 'Right', 'Roosters do not lay eggs', 'Straight down'], a: 2 },
  { q: 'You have two buckets. One holds 5 gallons, the other holds 3 gallons. How do you measure exactly 1 gallon?',             opts: ['Fill 5, pour into 3 (2 left), empty 3, pour 2 into 3, fill 5, pour 1 into 3', 'Fill 3 twice into 5', 'Fill 3, pour half into 5', 'Both A and B work'], a: 3 },
];

export default function LogicPuzzles() {
  return (
    <QuizGame
      questions={puzzles}
      xpPerCorrect={25}
      difficulty="Medium"
      feedbackDelayMs={1400}
      maxWidth={560}
      questionFontSize="1.1rem"
      resultIcon="🔗"
      resultTitle="All Puzzles Done!"
      messages={{ high: 'Galaxy-brain! 🧠', mid: 'Sharp thinking!', low: 'Nice effort — try again!' }}
      defaultBadge="Logic"
    />
  );
}
