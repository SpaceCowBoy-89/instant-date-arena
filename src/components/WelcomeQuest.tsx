const WelcomeQuest = ({ userId }) => {
  const [progressPercent, setProgressPercent] = useState(0);
  useEffect(() => {
    Storage.get({ key: `user_progress_${userId}` }).then(({ value }) => {
      if (value) {
        const { quizCompleted, chatsStarted, eventsJoined, profileCompleted } = JSON.parse(value);
        const total = (quizCompleted + (chatsStarted >= 5 ? 1 : 0) + (eventsJoined >= 3 ? 1 : 0) + profileCompleted) / 4 * 100;
        setProgressPercent(total);
      }
    });
  }, [userId]);
