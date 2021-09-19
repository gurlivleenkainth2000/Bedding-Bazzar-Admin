export class Videos {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  addedOn: firebase.default.firestore.Timestamp;
  active: boolean;
}
