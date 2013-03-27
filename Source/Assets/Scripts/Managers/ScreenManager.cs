using UnityEngine;
using System.Collections;


public class ScreenManager : MonoBehaviour
{
    //public bool HUDCorned           = true;

    public float ShowDelay          = 6.0f;                          // Time lapse to display Player status and then hide
    bool ShowState                  = false;
    float TimeLapse                 = 0.0f;

    GUISkin   gSkin                 = null;
    Texture2D FlashTex              = null;                          // Scene Rainbow tranition between scenes

    Rect FlashPos                   = new Rect(0, 0, Screen.width, Screen.height);
    bool FlashBang                  = false;

	float lastUpdate	            = 0;	
    float FlashLapse                = 0;

	int FlashX	 	                = 0;	
	int FlashY	 	                = 3;

// ----------------------------------------

    Texture2D HealthTex             = null;
    Rect HealthPos                  = new Rect();
    Rect HealthCoord                = new Rect(0, 0, .25f, .25f);               // player's Health HUD system

    Texture2D LifesTex              = null;
    Rect LifesPos                   = new Rect();
    Rect LifesCoord                 = new Rect(0, 0, 0.5f, 0.5f);               // player's Lifes HUD system

 // ----------------------------------------

    float FadeSpeed                 = 0.5f;                                     // Fade In/Out Transition speed
    bool  Fading                    = false;                                    // Fading State Activator       
    int   FadeDir                   = -1;
    float currentAlpha              = 0; 
    Color alphaColor                = new Color();								// Color object for alpha setting

// ----------------------------------------

    Texture2D ImageTex              = null;
    bool     ImageDisplay           = false;
    float    ImageLapse             = 0;
    

	void Awake () 
	{
        //Camera.main.transparencySortMode = TransparencySortMode.Orthographic;
        FlashTex = Resources.Load("GUI/Rainbow") as Texture2D;
        gSkin    = Resources.Load("GUI/GUISkin") as GUISkin;

        //gSkin = Resources.Load("GUI/GUISkin B") as GUISkin;
        //gSkin.label.fontSize 	= Mathf.RoundToInt( Screen.width * 0.035f );
		
		HealthTex = Resources.Load("GUI/Items") as Texture2D;
 		HealthPos = new Rect((Screen.width *.025f), (Screen.height *.75f), HealthTex.width *.65f, HealthTex.height *.65f);
 		
		LifesTex = Resources.Load("GUI/Lifes") as Texture2D;
		LifesPos = new Rect((Screen.width * .85f), (Screen.height * .85f), LifesTex.width, LifesTex.height);
	}

    public void ShowStatus()
    {
        this.ShowState = true;
        TimeLapse = ShowDelay;
    }   

    public void ShowFlash(float FlashDelay)
    {
        if (FlashBang) return;
        FlashBang = true;
        FlashLapse = FlashDelay;
    }

    public bool ShowImage( string path, float lapse = 2)
    {
        //WWW www = new WWW("file://" + path);
        //ImageTex = www.texture  ;
         
        ImageTex = (Texture2D)Resources.Load( path, typeof(Texture2D) )  ;

        if ( ImageTex != null )
        {
            ImageDisplay = true;
            ImageLapse = Time.time + lapse;
        }

        return ImageDisplay;
    }

    public void ShowFadeIn(  float speed = 2 )                                  // SI SE PERMITEN ESPECIFICADORES de PARAMETROS
    {
        FadeDir = -1;	
        FadeSpeed = speed;
        Fading  = true;
    }

    public void ShowFadeOut( float speed = 2 )                                  // SI SE PERMITEN ESPECIFICADORES de PARAMETROS
    {
        FadeDir = 1;	
        FadeSpeed = speed;
        Fading  = true;
    }

    void Update()
    {
    	if ( FlashBang )                                                        // FLASHBANG 
    	{
			if( (Time.time - lastUpdate) >= 0.021f ) // secs to update increment: 1/12 (12 frames) my speed: 48 frames / 1 sec
				{ FlashX++; lastUpdate = Time.time; }
			
			FlashY -= System.Convert.ToByte( FlashX > 3 );
			
			FlashX = FlashX % 4;
			FlashY += 3 * System.Convert.ToByte( (FlashY == 0) ); //FlashY % 4 (!FlashY);
			
    		FlashLapse -= Time.deltaTime;
    		FlashBang = (FlashLapse > 0);
    	}
    	
    	if ( ShowState  )                                                        // SHOW PLAYER STATUS
    	{   
            TimeLapse -= Time.deltaTime;	                					 // Decrease the message time
            ShowState = (TimeLapse > 0);
        }

        if ( ImageDisplay )                                                     // Display some Image while lapse is bigger
            ImageDisplay = (Time.time < ImageLapse);

        if ( Fading )                                                           // FADE IN/OUT
        {   
        	currentAlpha += FadeDir * FadeSpeed * Time.deltaTime;	
	        currentAlpha = Mathf.Clamp01(currentAlpha);
            alphaColor.a = currentAlpha;
            Fading = !(currentAlpha == 1 || currentAlpha == 0); // "If the the alpha transition ended Then stop Fading"
        }
    }
    //////////////////////////////////////////////////////////////     

    public void Render()
    {
        if (FlashBang && FlashTex)
        {
            GUI.DrawTextureWithTexCoords(FlashPos, FlashTex, new Rect(FlashX * .25f, FlashY * .25f, .25f, .25f));
            return;
        }

        if (gSkin) GUI.skin = gSkin;

        if ( ImageDisplay )
        {
            GUI.depth = -1000;
            GUI.DrawTexture( new Rect(0, 0, Screen.width, Screen.height), ImageTex);
        }

        // ------------------------------------------------ FADE IN OUT

        if ( currentAlpha > 0  && FlashTex )                                       // Draw only if not transculent
        {
            GUI.color = alphaColor;
            GUI.DrawTextureWithTexCoords(FlashPos, FlashTex, new Rect(.5f, 0, .25f, .25f));
            //GUI.DrawTexture( new Rect(0, 0, Screen.width, Screen.height), FadeTexture);
        }

        if (Managers.Game.IsPaused)
        {
            GUI.color = new Color(1, 0.36f, 0.22f, 1);
            GUI.Box(    new Rect((Screen.width * .5f) - (Screen.width * .15f),
                                 (Screen.height* .5f) - (Screen.height* .15f),
                                 (Screen.width * .3f) , (Screen.height* .3f)),
                                    "\n\n - PAUSE - \n press 'Q' to Quit Game \n and return Main Menu ");
            GUI.color = Color.clear;
            return;
        }

        if (Managers.Game.IsPlaying)
        {
            GUI.DrawTextureWithTexCoords(HealthPos, HealthTex, HealthCoord);

            if (!ShowState) return;

            GUI.DrawTextureWithTexCoords(LifesPos, LifesTex, LifesCoord);

            GUI.color = Color.magenta;
            GUI.Label( new Rect((Screen.width * .05f), (Screen.height * .02f), 100, 50),
                 "Score: " + Managers.Game.Score + "\n" + "Fruits: " + Managers.Game.Fruits);
            GUI.Label(new Rect((Screen.width * .92f), (Screen.height * .9f), 200, 50), "x" + Managers.Game.Lifes);
        }

        if (Managers.Game.Lifes <= 0)
        {
            //		    	GUI.skin.label.fontSize = 64;
            //		    	GUI.skin.label.fontStyle = FontStyle.Bold;
            GUI.color = Color.magenta;
            GUI.Label(new Rect((Screen.width * .35f), (Screen.height * .5f), 100, 50), "- GAME OVER -");
        }

    }
}