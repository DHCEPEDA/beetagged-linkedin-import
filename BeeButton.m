//
//  BeeButton.m
//  Bees Chest
//
//  Created by Chris O'Neil on 2/14/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "BeeButton.h"
#import "UIColor+Bee.h"

@implementation BeeButton

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        self.layer.cornerRadius = 2.0;
        self.backgroundColor = [UIColor goldBeeColor];
        [self setTintColor:[UIColor whiteColor]];
        [self.titleLabel setFont:[UIFont fontWithName:@"HelveticaNeue-Bold" size:18.0]];
    }
    return self;
}


/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect
{
    // Drawing code
}
*/

@end
