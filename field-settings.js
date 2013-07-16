( function( $ ) {
	var root = this;
	var bb = root.Backbone;
	var acfImageGrid = root.acfImageGrid = root.acfImageGrid || {};


	/**
	 * Model for which cells are locked.
	 * It retrieves and saves the results to an input element.
	 */
	var LockedModel = bb.Model.extend( {

		/**
		 * @param HTMLInputElement input - the input where the value is saved to
		 */
		init: function( input ) {
			this.input = $( input );

			var data = {};
			try {
				data = JSON.parse( this.input.val() );
				if ( !$.isPlainObject( data ) ) {
					data = {};
				}
			} catch( e ) { }

			this.set( data );
		},

		/**
		 * Save the value back to the input field
		 */
		save: function() {
			this.input.val( JSON.stringify( this.toJSON() ) );
		},


		/**
		 * Check if a cell is locked
		 *
		 * @param int x
		 * @param int y
		 */
		isCellLocked: function( x, y ) {
			return !!this.get( x+','+y );
		},

		/**
		 * Set the status of a locked
		 */
		setCellLocked: function( x, y, isLocked ) {
			if ( isLocked ) {
				this.set( x+','+y, true );
			} else {
				this.unset( x+','+y );
			}
		}
	} );


	/**
	 * View for selecting which cells are locked
	 */
	var LockedView = bb.View.extend( {

		/**
		 * Initialize the values
		 */
		initialize: function() {
			this.$numOfRows = $( '[name="'+this.$el.data('numberOfRows')+'"]' );
			this.$numOfColumns = $( '[name="'+this.$el.data('numberOfColumns')+'"]' );

			this.model = new LockedModel();
			this.model.init( this.$el );

			_.bindAll( this, 'onChange', 'renderCells' );
		},


		/**
		 * Render the table of checkboxes
		 */
		render: function() {
			this.$table = $('<table></table>');
			this.$el.after( this.$table );
			this.renderCells();
			this.$table.on( 'change', 'input[type="checkbox"]', this.onChange );
			this.$numOfRows.on( 'change input', this.renderCells );
			this.$numOfColumns.on( 'change input', this.renderCells );
		},


		/**
		 * Render the cells of checkboxes
		 */
		renderCells: function() {
			var tr, td, y, x, checkbox;
			this.$table.empty();

			for( y=0; y<this.$numOfRows.val(); ++y ) {
				tr = $('<tr></tr>').appendTo( this.$table );

				for( x=0; x<this.$numOfColumns.val(); ++x ) {
					checkbox = $('<input type="checkbox">').data( { x: x, y: y } ).prop( 'checked', this.model.isCellLocked( x, y ) );
					td = $('<td>').append( checkbox ).appendTo( tr );
				}
			}
		},


		onChange: function( event ) {
			var checkbox = $( event.target );
			this.model.setCellLocked( checkbox.data('x'), checkbox.data('y'), checkbox.prop( 'checked' ) );
			this.model.save();
		}
	} );


	/**
	 * Call this to create the UI for selecting locked cells
	 */
	acfImageGrid.createLockedCellUISelector = function( input ) {
		var view = new LockedView( { el: $(input) } );
		view.render();
	};
} )( jQuery );