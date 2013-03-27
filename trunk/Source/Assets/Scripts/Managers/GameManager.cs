using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
    public uint Score              = 0;
    public uint Fruits             = 0;
    public uint TopScore           = 100;

    //int FireGauge         = 0;
    //int Key               = 0;
    public uint Health      = 3;
    public uint Lifes       = 3;

    public bool ShowState   = true;
    public bool IsPlaying   = false;
    public bool IsPaused    = false;

    //float ShowDelay         = 6.0f;
    //float TimeLapse         = 0.0f;

    //Texture2D HealthTex     = null;
    //Rect HealthPos          = new Rect();
    //Rect HealthCoord        = new Rect(0, 0, .25f, .25f);

    //Texture2D LifesTex      = null;
    //Rect LifesPos           = new Rect();
    //Rect LifesCoord         = new Rect(0, 0, 0.5f, 0.5f);

    //////////////////////////////////////////////////////////////

    private List<GameState> states = new List<GameState>();
    private bool Running;

    public GameObject PlayerPrefab;
    public int UnlockedStages = 1;


    void Start()
    {
        PlayerPrefab = GameObject.FindGameObjectWithTag("Player")as GameObject;
        if (!PlayerPrefab) Debug.LogWarning("Player not in Scene");

        PushState(typeof(IntroState)); // Loading some State
        UnlockedStages = PlayerPrefs.GetInt("UnlockedStages");
        if (UnlockedStages == 0)
            UnlockedStages = 1;
    }

    void OnApplicationQuit() 	// "DeInit()"
    {
        // cleanup the all states
        while (states.Count > 0)
        {
            states[states.Count - 1].DeInit();
            states.RemoveAt(states.Count - 1);
        }

        PlayerPrefs.SetInt("UnlockedStages", UnlockedStages);
    }

    void Update()
    {

        if (states.Count > 0)
            states[states.Count - 1].OnUpdate();
    }

    public void ChangeState(System.Type newStateType)		// Swap two states
    {
        // if not Empty CleanUp current State
        if (states.Count > 0)
        {
            states[states.Count - 1].DeInit();
            states.RemoveAt(states.Count - 1);
        }

        //Managers.Display.ShowSynth( 0.05f);	

        // store and init the new state
        states.Add(GetComponentInChildren(newStateType) as GameState);
        states[states.Count - 1].Init();
    }

    public void PushState(System.Type newStateType)		// Hold back previous states
    {
        // pause current state
        if (states.Count > 0)
            states[states.Count - 1].Pause();

        //Managers.Display.ShowSynth( 0.25f);	

        // store and init the new state
        states.Add(GetComponentInChildren(newStateType) as GameState);
        states[states.Count - 1].Init();
    }

    public void PopState()
    {
        // cleanup the current state
        if (states.Count > 0)
        {
            states[states.Count - 1].DeInit();
            states.RemoveAt(states.Count - 1);
        }

        //Managers.Display.ShowSynth( 0.05f);	

        // resume previous state
        if (states.Count > 0)
            states[states.Count - 1].Resume();
    }

    public GameState State
    {
        get { return states[states.Count - 1]; }
    }

    public void ShowHelp()
    {
        if (states.Count > 0)
            states[states.Count - 1].ShowHelp();
    }

    //Changes the current game state
    public void SetState(System.Type newStateType)
    {
        this.SetState(newStateType, 0);
    }

    public void SetState(System.Type newStateType, float Delay)
    {
        StartCoroutine(CloseLastState(newStateType, Delay));
    }

    private IEnumerator CloseLastState(System.Type newStateType, float Delay)
    {
        yield return new WaitForSeconds(Delay);								// We must check the end of Button animation

        if (states.Count > 0)
            states[states.Count - 1].DeInit();

        states[states.Count - 1] = GetComponentInChildren(newStateType) as GameState;

        if (states.Count > 0)
            states[states.Count - 1].Init();
    }



    //public void ShowStatus()
    //{
    //    ShowState = true;
    //    TimeLapse = ShowDelay;
    //}
    //////////////////////////////////////////////////////////////


    public void SetPause(bool PauseState)
    {
        IsPaused = PauseState;
        //GameObject player = GameObject.FindGameObjectWithTag("Player");

        if (IsPaused)
        {
            Time.timeScale = 0.00000000000001f;
            //(player.GetComponent<PlayerControls>() as PlayerControls).enabled = false;
            //( (PlayerControls) player.GetComponent(typeof(PlayerControls)) ).enabled = false;
        }
        else
        {
            Time.timeScale = 1f;
            //(player.GetComponent<PlayerControls>()as PlayerControls).enabled = true;
        }
        AudioListener.pause = IsPaused;

    }
    //////////////////////////////////////////////////////////////

    public void GameOver()
    {
        IsPlaying = false;
        ResetStats();
        //ShowFlash(2.0f);

        Application.LoadLevel("Intro");
    }
    //////////////////////////////////////////////////////////////

    public void ResetStats()
    {
        if (Score > TopScore)
            TopScore = Score;
        PlayerPrefs.SetInt("TopScore", (int)TopScore);

        Score = 0;
        Fruits = 0;

        //FireGauge = 0;
        //Key = 0;

        ShowState = false;
        Health = 3;
        Lifes = 3;
    }
    //////////////////////////////////////////////////////////////

    public void DeInit() { ;}
    //////////////////////////////////////////////////////////////

    public void Update(float lfTimestep)
    {

        if (IsPlaying && Input.GetKeyDown("escape"))
            SetPause(!IsPaused);
        if (IsPaused && Input.GetKeyDown("q"))
        {
            SetPause(false);
            GameOver();
        }

        //HealthCoord = new Rect(Health * .25f, 0, .25f, .25f);

        if (((Fruits % 100) == 0) && System.Convert.ToBoolean(Fruits))
        { 
            ShowState = true; 
            Lifes++; 
            Fruits++;
        }


        //if (ShowState)
        //{
        //    TimeLapse -= lfTimestep;	                					        // Decrease the message time
        //    ShowState = (TimeLapse > 0.0f);
        //}

        //if (Input.GetButtonDown("Fire1"))
        //    Managers.Tiled.Load("/Levels/level1.tmx");
        //if (Input.GetButtonDown("Fire2"))
        //    Managers.Tiled.Unload();

        //if (Input.GetKeyUp("i"))
        //    Managers.Display.ShowImage("D:/Niangapiry/Source/Assets/Materials/Textures/sunhouse.png", 3);
        //if (Input.GetKeyUp("i"))
        //    Managers.Display.ShowImage("GUI/Lifes", 3);

        //if (Input.GetButtonDown("Fire2"))
        //    Managers.Display.ShowFadeOut(2);

        //if (Input.GetButtonDown("Fire1"))
        //    Managers.Display.ShowFadeIn(5);

    }
    //////////////////////////////////////////////////////////////     

    //public void Render()
    //{




        //if (IsPaused)
        //{
        //    GUI.color = new Color(1, 0.36f, 0.22f, 1);
        //    GUI.Box(new Rect((Screen.width * .5f) - (Screen.width * .15f),
        //                 (Screen.height * .5f) - (Screen.height * .15f),
        //                  (Screen.width * .3f), (Screen.height * .3f)),
        //                    "\n\n - PAUSE - \n press 'Q' to Quit Game \n and return Main Menu ");
        //    GUI.color = Color.clear;
        //    return;
        //}

        //if (IsPlaying)
        //{
        //    GUI.DrawTextureWithTexCoords(HealthPos, HealthTex, HealthCoord);

        //    if (!ShowState) return;

        //    GUI.DrawTextureWithTexCoords(LifesPos, LifesTex, LifesCoord);

        //    GUI.color = Color.magenta;
        //    GUI.Label(new Rect((Screen.width * .05f), (Screen.height * .02f), 100, 50),
        //         "Score: " + Score + "\n" + "Fruits: " + Fruits);
        //    GUI.Label(new Rect((Screen.width * .92f), (Screen.height * .9f), 200, 50), "x" + Lifes);
        //}

        //if (Lifes <= 0)
        //{
        //    //		    	GUI.skin.label.fontSize = 64;
        //    //		    	GUI.skin.label.fontStyle = FontStyle.Bold;
        //    GUI.color = Color.magenta;
        //    GUI.Label(new Rect((Screen.width * .35f), (Screen.height * .5f), 100, 50), "- GAME OVER -");
        //}

    //}

}

