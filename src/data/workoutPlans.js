export const WORKOUT_PLANS = [
  {
    day: "Leg Day",
    dayOfWeek: "Monday",
    icon: "🦵",
    duration: "50 min",
    calories: 350,
    exercises: [
      {
        id: "squats",
        name: "Squats",
        targetMuscle: "Quads, Glutes",
        sets: 3,
        reps: 12,
        equipment: "Bodyweight / Barbell",
        youtubeUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
        videoId: "aclHkVaku9U",
        thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Stand with feet shoulder-width apart.",
          "Keep chest up and back straight.",
          "Lower hips like sitting on a chair.",
          "Push through heels to stand up."
        ],
        mistakes: [
          "Knees collapsing inward",
          "Rounding the back",
          "Lifting heels"
        ]
      },
      {
        id: "lunges",
        name: "Lunges",
        targetMuscle: "Quads, Hamstrings",
        sets: 3,
        reps: 12,
        equipment: "Bodyweight",
        youtubeUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
        videoId: "QOVaHwm-Q6U",
        thumbnail: "https://images.unsplash.com/photo-1596333060100-333e8c25781a?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Step forward with one leg.",
          "Lower hips until both knees are bent at a 90-degree angle.",
          "Keep front knee directly above ankle.",
          "Push back to starting position."
        ],
        mistakes: [
          "Leaning too far forward",
          "Front knee passing toes",
          "Losing balance"
        ]
      },
      {
        id: "leg_press",
        name: "Leg Press",
        targetMuscle: "Quads, Glutes",
        sets: 3,
        reps: 12,
        equipment: "Leg Press Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
        videoId: "IZxyjW7MPJQ",
        thumbnail: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Sit on the machine with feet shoulder-width apart on the platform.",
          "Lower the platform towards your chest.",
          "Push the platform back up without locking your knees.",
          "Control the weight on the way down."
        ],
        mistakes: [
          "Locking knees at the top",
          "Lifting lower back off the seat",
          "Range of motion too short"
        ]
      },
      {
        id: "calf_raises",
        name: "Calf Raises",
        targetMuscle: "Calves",
        sets: 3,
        reps: 15,
        equipment: "Standing / Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=-M4-G8p8fmc",
        videoId: "-M4-G8p8fmc",
        thumbnail: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Stand on the edge of a step.",
          "Raise your heels as high as possible.",
          "Hold for a second at the top.",
          "Lower your heels below the level of the step."
        ],
        mistakes: [
          "Bouncing at the bottom",
          "Not using full range of motion",
          "Leaning forward too much"
        ]
      },
      {
        id: "leg_extension",
        name: "Leg Extension",
        targetMuscle: "Quads",
        sets: 3,
        reps: 12,
        equipment: "Leg Extension Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=YyvSfVLYd80",
        videoId: "YyvSfVLYd80",
        thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Sit on the machine with legs under the padded bar.",
          "Extend your legs until they are straight.",
          "Squeeze your quads at the top.",
          "Lower the weight slowly."
        ],
        mistakes: [
          "Using momentum",
          "Not completing the full movement",
          "Lifting hips off the seat"
        ]
      }
    ]
  },
  {
    day: "Chest Day",
    dayOfWeek: "Tuesday",
    icon: "💪",
    duration: "45 min",
    calories: 280,
    exercises: [
      {
        id: "push_ups",
        name: "Push-ups",
        targetMuscle: "Chest, Triceps",
        sets: 3,
        reps: 15,
        equipment: "Bodyweight",
        youtubeUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
        videoId: "IODxDxX7oi4",
        thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Start in a plank position.",
          "Lower your body until chest nearly touches the floor.",
          "Push back up to starting position.",
          "Keep your core tight."
        ],
        mistakes: [
          "Sagging lower back",
          "Flaring elbows too much",
          "Incomplete range of motion"
        ]
      },
      {
        id: "bench_press",
        name: "Bench Press",
        targetMuscle: "Chest, Shoulders, Triceps",
        sets: 3,
        reps: 10,
        equipment: "Barbell / Bench",
        youtubeUrl: "https://www.youtube.com/watch?v=rT7DgIPn5rk",
        videoId: "rT7DgIPn5rk",
        thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Lie on a flat bench.",
          "Grip the barbell slightly wider than shoulder-width.",
          "Lower the bar to mid-chest.",
          "Push the bar back up."
        ],
        mistakes: [
          "Bouncing the bar off chest",
          "Lifting glutes off bench",
          "Uneven grip"
        ]
      },
      {
        id: "incline_press",
        name: "Incline Dumbbell Press",
        targetMuscle: "Upper Chest",
        sets: 3,
        reps: 12,
        equipment: "Dumbbells / Incline Bench",
        youtubeUrl: "https://www.youtube.com/watch?v=0G2_XV7slIs",
        videoId: "0G2_XV7slIs",
        thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Lie on an incline bench (30-45 degrees).",
          "Press dumbbells up over chest.",
          "Lower dumbbells to sides of chest.",
          "Keep elbows at a 45-degree angle."
        ],
        mistakes: [
          "Bench angle too steep",
          "Arching back excessively",
          "Clanging dumbbells at top"
        ]
      },
      {
        id: "chest_fly",
        name: "Chest Fly",
        targetMuscle: "Chest",
        sets: 3,
        reps: 15,
        equipment: "Dumbbells / Cables",
        youtubeUrl: "https://www.youtube.com/watch?v=eGjt4lk6gjw",
        videoId: "eGjt4lk6gjw",
        thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Lie on a bench with dumbbells over chest.",
          "Lower arms in a wide arc.",
          "Squeeze chest as you bring weights back together.",
          "Keep a slight bend in elbows."
        ],
        mistakes: [
          "Locking elbows",
          "Lowering weights too far",
          "Using too much weight"
        ]
      },
      {
        id: "dips",
        name: "Dips",
        targetMuscle: "Lower Chest, Triceps",
        sets: 3,
        reps: 12,
        equipment: "Parallel Bars",
        youtubeUrl: "https://www.youtube.com/watch?v=6kALZikXxLc",
        videoId: "6kALZikXxLc",
        thumbnail: "https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold onto parallel bars.",
          "Lower your body by bending elbows.",
          "Lean forward slightly to focus on chest.",
          "Push back up."
        ],
        mistakes: [
          "Not going deep enough",
          "Locking elbows at top",
          "Excessive swinging"
        ]
      }
    ]
  },
  {
    day: "Back Day",
    dayOfWeek: "Wednesday",
    icon: "🏋️‍♂️",
    duration: "45 min",
    calories: 300,
    exercises: [
      {
        id: "lat_pulldown",
        name: "Lat Pulldown",
        targetMuscle: "Lats, Biceps",
        sets: 3,
        reps: 12,
        equipment: "Cable Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
        videoId: "CAwf7n6Luuc",
        thumbnail: "https://images.unsplash.com/photo-1598971639058-aba7c12af0c0?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Grip the bar wider than shoulders.",
          "Pull the bar down to upper chest.",
          "Squeeze shoulder blades together.",
          "Slowly return bar to top."
        ],
        mistakes: [
          "Pulling behind the neck",
          "Leaning back too much",
          "Using momentum"
        ]
      },
      {
        id: "seated_row",
        name: "Seated Row",
        targetMuscle: "Middle Back",
        sets: 3,
        reps: 12,
        equipment: "Cable Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=GZbfZ033f74",
        videoId: "GZbfZ033f74",
        thumbnail: "https://images.unsplash.com/photo-1591940742888-11b2f0000abc?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Sit with feet on pads, knees slightly bent.",
          "Pull handle towards abdomen.",
          "Keep back straight and chest out.",
          "Extend arms fully on return."
        ],
        mistakes: [
          "Rounding the back",
          "Shrugging shoulders",
          "Rocking torso"
        ]
      },
      {
        id: "deadlift",
        name: "Deadlift",
        targetMuscle: "Back, Hamstrings, Glutes",
        sets: 3,
        reps: 8,
        equipment: "Barbell",
        youtubeUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q",
        videoId: "op9kVnSso6Q",
        thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Stand with feet mid-foot under bar.",
          "Grip bar and bend knees until shins touch.",
          "Keep back flat, chest up.",
          "Lift bar by standing up straight."
        ],
        mistakes: [
          "Rounding the back",
          "Bar too far from shins",
          "Jerking the weight"
        ]
      },
      {
        id: "pull_ups",
        name: "Pull-ups",
        targetMuscle: "Lats, Biceps",
        sets: 3,
        reps: 8,
        equipment: "Pull-up Bar",
        youtubeUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
        videoId: "eGo4IYlbE5g",
        thumbnail: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Grip bar with palms facing away.",
          "Pull yourself up until chin is over bar.",
          "Lower yourself slowly.",
          "Keep core engaged."
        ],
        mistakes: [
          "Kicking or 'kipping'",
          "Not going all the way down",
          "Rounding shoulders forward"
        ]
      },
      {
        id: "face_pull",
        name: "Face Pull",
        targetMuscle: "Rear Delts, Upper Back",
        sets: 3,
        reps: 15,
        equipment: "Cables / Rope",
        youtubeUrl: "https://www.youtube.com/watch?v=rep-qVOkqgk",
        videoId: "rep-qVOkqgk",
        thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold rope attachment at face height.",
          "Pull rope towards forehead.",
          "Pull ends of rope apart at end of movement.",
          "Slowly return to start."
        ],
        mistakes: [
          "Pulling too low",
          "Using too much weight",
          "Not squeezing at the back"
        ]
      }
    ]
  },
  {
    day: "Shoulder Day",
    dayOfWeek: "Thursday",
    icon: "🔥",
    duration: "40 min",
    calories: 240,
    exercises: [
      {
        id: "shoulder_press",
        name: "Shoulder Press",
        targetMuscle: "Shoulders, Triceps",
        sets: 3,
        reps: 10,
        equipment: "Dumbbells / Barbell",
        youtubeUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
        videoId: "qEwKCR5JCog",
        thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Sit or stand with weights at shoulder height.",
          "Press weights overhead until arms are straight.",
          "Lower weights slowly back to shoulders.",
          "Don't lock elbows completely."
        ],
        mistakes: [
          "Arching back excessively",
          "Pushing weights forward",
          "Using legs to cheat (in strict press)"
        ]
      },
      {
        id: "lateral_raises",
        name: "Lateral Raises",
        targetMuscle: "Side Delts",
        sets: 3,
        reps: 15,
        equipment: "Dumbbells",
        youtubeUrl: "https://www.youtube.com/watch?v=WJm9JpxN7pE",
        videoId: "WJm9JpxN7pE",
        thumbnail: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold dumbbells at sides.",
          "Raise arms out to sides until shoulder height.",
          "Keep a slight bend in elbows.",
          "Lower weights slowly."
        ],
        mistakes: [
          "Swinging the weights",
          "Raising weights too high",
          "Leaning forward"
        ]
      },
      {
        id: "front_raises",
        name: "Front Raises",
        targetMuscle: "Front Delts",
        sets: 3,
        reps: 12,
        equipment: "Dumbbells / Plate",
        youtubeUrl: "https://www.youtube.com/watch?v=hRJ6EBK5990",
        videoId: "hRJ6EBK5990",
        thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold weights in front of thighs.",
          "Raise weights forward to shoulder height.",
          "Control the weight on the way down.",
          "Keep torso still."
        ],
        mistakes: [
          "Rocking the body",
          "Using too much weight",
          "Lifting above shoulder level"
        ]
      },
      {
        id: "shrugs",
        name: "Shrugs",
        targetMuscle: "Traps",
        sets: 3,
        reps: 15,
        equipment: "Dumbbells / Barbell",
        youtubeUrl: "https://www.youtube.com/watch?v=gT_uI757SIs",
        videoId: "gT_uI757SIs",
        thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold weights at sides.",
          "Lift shoulders as high as possible.",
          "Hold for a second at the top.",
          "Lower shoulders back down."
        ],
        mistakes: [
          "Rolling shoulders",
          "Using arms to lift",
          "Dropping weights too fast"
        ]
      },
      {
        id: "rear_delt_fly",
        name: "Rear Delt Fly",
        targetMuscle: "Rear Delts",
        sets: 3,
        reps: 15,
        equipment: "Dumbbells / Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=6yMdhi2DVao",
        videoId: "6yMdhi2DVao",
        thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Bend forward at hips with back flat.",
          "Raise weights out to sides.",
          "Squeeze shoulder blades together.",
          "Lower weights slowly."
        ],
        mistakes: [
          "Rounding the back",
          "Using momentum",
          "Looking up (strain on neck)"
        ]
      }
    ]
  },
  {
    day: "Arms Day",
    dayOfWeek: "Friday",
    icon: "💪",
    duration: "45 min",
    calories: 280,
    exercises: [
      {
        id: "bicep_curls",
        name: "Bicep Curls",
        targetMuscle: "Biceps",
        sets: 3,
        reps: 12,
        equipment: "Dumbbells / Barbell",
        youtubeUrl: "https://www.youtube.com/watch?v=ykJgr1hx3KQ",
        videoId: "ykJgr1hx3KQ",
        thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold weights with palms facing forward.",
          "Curl weights toward shoulders.",
          "Keep elbows tucked at sides.",
          "Lower weights fully."
        ],
        mistakes: [
          "Swinging elbows",
          "Not using full range of motion",
          "Curling wrists"
        ]
      },
      {
        id: "hammer_curls",
        name: "Hammer Curls",
        targetMuscle: "Biceps, Brachialis",
        sets: 3,
        reps: 12,
        equipment: "Dumbbells",
        youtubeUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4",
        videoId: "zC3nLlEvin4",
        thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hold dumbbells with palms facing torso.",
          "Curl weights toward shoulders.",
          "Maintain neutral grip.",
          "Lower weights slowly."
        ],
        mistakes: [
          "Using momentum",
          "Moving elbows forward",
          "Partial reps"
        ]
      },
      {
        id: "triceps_pushdown",
        name: "Triceps Pushdown",
        targetMuscle: "Triceps",
        sets: 3,
        reps: 15,
        equipment: "Cable Machine",
        youtubeUrl: "https://www.youtube.com/watch?v=2-LAMcpzHLU",
        videoId: "2-LAMcpzHLU",
        thumbnail: "https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Grip bar or rope at chest height.",
          "Push down until arms are fully extended.",
          "Squeeze triceps at bottom.",
          "Slowly return to start."
        ],
        mistakes: [
          "Letting elbows move away from sides",
          "Using body weight to push",
          "Not extending fully"
        ]
      },
      {
        id: "tricep_dips",
        name: "Tricep Dips",
        targetMuscle: "Triceps",
        sets: 3,
        reps: 12,
        equipment: "Bench / Chair",
        youtubeUrl: "https://www.youtube.com/watch?v=6kALZikXxLc",
        videoId: "6kALZikXxLc",
        thumbnail: "https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Place hands on edge of bench.",
          "Lower hips by bending elbows.",
          "Push back up to start.",
          "Keep back close to bench."
        ],
        mistakes: [
          "Shoulders rolling forward",
          "Flaring elbows",
          "Hips moving too far from bench"
        ]
      },
      {
        id: "concentration_curl",
        name: "Concentration Curl",
        targetMuscle: "Biceps",
        sets: 3,
        reps: 12,
        equipment: "Dumbbell",
        youtubeUrl: "https://www.youtube.com/watch?v=JvjKuAnM_6g",
        videoId: "JvjKuAnM_6g",
        thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Sit on bench, elbow against inner thigh.",
          "Curl weight toward shoulder.",
          "Control the descent.",
          "Focus on the bicep peak."
        ],
        mistakes: [
          "Lifting elbow off thigh",
          "Using momentum",
          "Not reaching full extension"
        ]
      }
    ]
  },
  {
    day: "Full Body",
    dayOfWeek: "Saturday",
    icon: "🏃",
    duration: "60 min",
    calories: 400,
    exercises: [
      {
        id: "fb_squats",
        name: "Squats",
        targetMuscle: "Quads, Glutes",
        sets: 3,
        reps: 12,
        equipment: "Bodyweight",
        youtubeUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
        videoId: "aclHkVaku9U",
        thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Stand with feet shoulder-width apart.",
          "Lower hips as if sitting on a chair.",
          "Push through heels to stand up."
        ],
        mistakes: ["Knees in", "Back rounding"]
      },
      {
        id: "fb_push_ups",
        name: "Push-ups",
        targetMuscle: "Chest, Triceps",
        sets: 3,
        reps: 15,
        equipment: "Bodyweight",
        youtubeUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
        videoId: "IODxDxX7oi4",
        thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Plank position.",
          "Lower chest to floor.",
          "Push back up."
        ],
        mistakes: ["Sagging back", "Elbows flaring"]
      },
      {
        id: "fb_deadlift",
        name: "Deadlift",
        targetMuscle: "Back, Legs",
        sets: 3,
        reps: 10,
        equipment: "Barbell",
        youtubeUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q",
        videoId: "op9kVnSso6Q",
        thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Hinge at hips to grab bar.",
          "Lift by standing up straight.",
          "Keep back flat."
        ],
        mistakes: ["Rounded back", "Jerking weight"]
      },
      {
        id: "mountain_climbers",
        name: "Mountain Climbers",
        targetMuscle: "Core, Cardio",
        sets: 3,
        reps: 20,
        equipment: "Bodyweight",
        youtubeUrl: "https://www.youtube.com/watch?v=cnyTQDSE884",
        videoId: "cnyTQDSE884",
        thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Start in plank position.",
          "Drive knees toward chest alternately.",
          "Keep hips level."
        ],
        mistakes: ["Butt too high", "Moving too fast/sloppy"]
      },
      {
        id: "plank",
        name: "Plank",
        targetMuscle: "Core",
        sets: 3,
        reps: "45 sec",
        equipment: "Bodyweight",
        youtubeUrl: "https://www.youtube.com/watch?v=TvxNkmjdhMM",
        videoId: "TvxNkmjdhMM",
        thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
        instructions: [
          "Rest on forearms and toes.",
          "Keep body in a straight line.",
          "Engage core and glutes."
        ],
        mistakes: ["Sagging hips", "Holding breath"]
      }
    ]
  },
  {
    day: "Rest Day",
    dayOfWeek: "Sunday",
    icon: "😴",
    duration: "30 min",
    calories: 100,
    exercises: [
      {
        id: "stretching",
        name: "Stretching",
        targetMuscle: "Full Body",
        sets: 1,
        reps: "10 min",
        equipment: "None",
        youtubeUrl: "https://www.youtube.com/watch?v=mD9v9F3U_Sg",
        videoId: "mD9v9F3U_Sg",
        thumbnail: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=400&auto=format&fit=crop",
        instructions: ["Hold major muscle group stretches for 30s each."],
        mistakes: ["Bouncing", "Holding breath"]
      },
      {
        id: "walking",
        name: "Walking",
        targetMuscle: "Cardio",
        sets: 1,
        reps: "20 min",
        equipment: "Shoes",
        youtubeUrl: "https://www.youtube.com/watch?v=OiaXW_r297k",
        videoId: "OiaXW_r297k",
        thumbnail: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=400&auto=format&fit=crop",
        instructions: ["Maintain a brisk pace."],
        mistakes: ["Poor posture"]
      },
      {
        id: "yoga",
        name: "Yoga",
        targetMuscle: "Mind & Body",
        sets: 1,
        reps: "15 min",
        equipment: "Mat",
        youtubeUrl: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
        videoId: "v7AYKMP6rOE",
        thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop",
        instructions: ["Focus on breathing and flow through basic poses."],
        mistakes: ["Forcing poses", "Holding breath"]
      },
      {
        id: "mobility",
        name: "Mobility",
        targetMuscle: "Joints",
        sets: 1,
        reps: "15 min",
        equipment: "None",
        youtubeUrl: "https://www.youtube.com/watch?v=77m_Y_M4n_A",
        videoId: "77m_Y_M4n_A",
        thumbnail: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=400&auto=format&fit=crop",
        instructions: ["Gentle joint rotations and dynamic movements."],
        mistakes: ["Jerky movements", "Overextending"]
      }
    ]
  }
];
