import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const currentMonthStr = currentMonth.toISOString().split('T')[0]

    console.log(`Processing recurring expenses for month: ${currentMonthStr}`)

    // Get all active recurring expenses that haven't been generated this month
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('is_active', true)
      .or(`last_generated_month.is.null,last_generated_month.lt.${currentMonthStr}`)

    if (fetchError) {
      console.error('Error fetching recurring expenses:', fetchError)
      throw fetchError
    }

    console.log(`Found ${recurringExpenses?.length || 0} recurring expenses to process`)

    const generatedExpenses = []

    for (const recurring of recurringExpenses || []) {
      // Calculate the expense date for this month
      const expenseDate = new Date(today.getFullYear(), today.getMonth(), recurring.day_of_month)
      
      // Only generate if we've passed the day of month or it's today
      if (expenseDate <= today) {
        const expenseDateStr = expenseDate.toISOString().split('T')[0]

        // Create the expense
        const { data: newExpense, error: insertError } = await supabase
          .from('expenses')
          .insert({
            household_id: recurring.household_id,
            user_id: recurring.user_id,
            category_id: recurring.category_id,
            amount: recurring.amount,
            description: recurring.description,
            notes: recurring.notes ? `${recurring.notes} (Recurring)` : '(Recurring)',
            date: expenseDateStr
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Error creating expense for recurring ${recurring.id}:`, insertError)
          continue
        }

        // Update last_generated_month
        await supabase
          .from('recurring_expenses')
          .update({ last_generated_month: currentMonthStr })
          .eq('id', recurring.id)

        generatedExpenses.push(newExpense)
        console.log(`Generated expense from recurring ${recurring.id}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${generatedExpenses.length} expenses`,
        expenses: generatedExpenses 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    console.error('Error in generate-recurring-expenses:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
