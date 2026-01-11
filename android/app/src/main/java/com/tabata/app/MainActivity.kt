package com.tabata.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.tabata.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.startButton.setOnClickListener {
            binding.statusText.text = getString(R.string.session_ready)
        }
    }
}
